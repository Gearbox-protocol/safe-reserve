// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {SafeTx} from "./interfaces/Types.sol";
import {Safe, Enum} from "@safe-smart-account/Safe.sol";
import {IGuard} from "./interfaces/IGuard.sol";
import {NoDelegateCallsGuard} from "./guards/NoDelegateCallsGuard.sol";

address constant MULTISEND = 0x40A2aCCbd92BCA938b02010E17A5b8929b49130D;

contract SafeStorage {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // Events
    event TransactionRegistered(address indexed safe, bytes32 indexed txHash, uint256 nonce);
    event TransactionExecuted(address indexed safe, bytes32 indexed txHash);
    event GuardAdded(address indexed safe, address indexed guard);
    event GuardRemoved(address indexed safe, address indexed guard);

    // Mapping of Safe address to its custom guards
    mapping(address => EnumerableSet.AddressSet) private guards;
    // Indicates if a Safe is using custom guards instead of default ones
    mapping(address => bool) public customGuards;
    // Tracks the highest nonce of regist for each Safe
    mapping(address => uint256) public maxNonces;

    // Stores transaction hashes for each Safe and nonce
    mapping(address => mapping(uint256 => EnumerableSet.Bytes32Set)) private hashes;
    // Stores the actual transaction data for each hash
    mapping(bytes32 => SafeTx) public txs;

    // List of default guards applied to all Safes without custom guards
    address[] public defaultGuards;

    // Ensures caller is an owner of the specified Safe
    modifier onlySafeOwners(address payable safe) {
        if (!Safe(safe).isOwner(msg.sender)) {
            revert("Not a safe owner");
        }
        _;
    }

    // Ensures caller is the Safe contract itself
    modifier onlySafe(address payable safe) {
        if (address(safe) != msg.sender) {
            revert("Not a safe");
        }
        _;
    }

    // Initialize contract with default NoDelegateCallsGuard
    constructor() {
        defaultGuards.push(address(new NoDelegateCallsGuard(MULTISEND)));
    }

    /// @notice Registers a new transaction for a Safe after checking it against guards
    /// @param safe The Safe contract address
    /// @param safeTx The transaction to register
    /// @return hash The unique identifier for the registered transaction
    function registerTx(address payable safe, SafeTx calldata safeTx) external onlySafeOwners(safe) returns (bytes32) {
        {
            address[] memory guard = customGuards[safe] ? guards[safe].values() : defaultGuards;
            uint256 length = guard.length;
            for (uint256 i = 0; i < length; ++i) {
                IGuard(guard[i]).checkTransaction(safeTx);
            }
        }

        bytes32 hash = Safe(safe).getTransactionHash(
            // Transaction info
            safeTx.to,
            safeTx.value,
            safeTx.data,
            safeTx.operation,
            safeTx.safeTxGas,
            // Payment info
            safeTx.baseGas,
            safeTx.gasPrice,
            safeTx.gasToken,
            safeTx.refundReceiver,
            // Signature info
            safeTx.nonce
        );
        // Increase nonce and execute transaction.

        hashes[safe][safeTx.nonce].add(hash);
        txs[hash] = safeTx;

        if (safeTx.nonce > maxNonces[safe]) {
            maxNonces[safe] = safeTx.nonce;
        }

        emit TransactionRegistered(safe, hash, safeTx.nonce);
        return hash;
    }

    /// @notice Executes a previously registered transaction if it has enough signatures
    /// @param safe The Safe contract address
    /// @param hash The transaction hash to execute
    function executeTx(address payable safe, bytes32 hash) external {
        bytes memory signaturesData;
        address[] memory owners = Safe(safe).getOwners();
        uint256 threshold = Safe(safe).getThreshold();
        uint256 nonce = Safe(safe).nonce();

        if (!hashes[safe][nonce].contains(hash)) {
            revert("Tx not found");
        }

        SafeTx memory execTx = txs[hash];

        if (nonce != execTx.nonce) {
            revert("Invalid nonce");
        }

        uint256 signed = 0;
        bytes32[] memory signatures = new bytes32[](threshold);

        for (uint256 i = 0; i < owners.length; ++i) {
            if (Safe(safe).approvedHashes(owners[i], hash) > 0) {
                signatures[signed] = bytes32(uint256(uint160(owners[i])));
                signed++;
                if (signed == threshold) {
                    break;
                }
            }
        }

        if (signed < threshold) {
            revert("Not enough signatures");
        }

        // Sort signers in ascending order
        for (uint256 i = 0; i < threshold - 1; ++i) {
            for (uint256 j = 0; j < threshold - i - 1; ++j) {
                if (signatures[j] > signatures[j + 1]) {
                    bytes32 temp = signatures[j];
                    signatures[j] = signatures[j + 1];
                    signatures[j + 1] = temp;
                }
            }
        }

        for (uint256 i = 0; i < threshold; ++i) {
            signaturesData = bytes.concat(signaturesData, signatures[i], bytes32(0), bytes1(0x01));
        }

        _executeTx(safe, execTx, signaturesData);
        emit TransactionExecuted(safe, hash);
    }

    /// @notice Internal function to execute the Safe transaction
    /// @param safe The Safe contract address
    /// @param safeTx The transaction to execute
    /// @param signaturesData The packed signature data from owners
    function _executeTx(address payable safe, SafeTx memory safeTx, bytes memory signaturesData) internal {
        Safe(safe).execTransaction(
            safeTx.to,
            safeTx.value,
            safeTx.data,
            safeTx.operation,
            safeTx.safeTxGas,
            safeTx.baseGas,
            safeTx.gasPrice,
            safeTx.gasToken,
            payable(safeTx.refundReceiver),
            signaturesData
        );
    }

    /// @notice Returns the list of guards for a Safe
    /// @param safe The Safe address to query
    /// @return Array of guard addresses
    function getGuards(address safe) public view returns (address[] memory) {
        return guards[safe].values();
    }

    /// @notice Adds a custom guard for the calling Safe
    /// @param guard The guard contract address to add
    function addCustomGuard(address guard) external {
        customGuards[msg.sender] = true;
        guards[msg.sender].add(guard);
        emit GuardAdded(msg.sender, guard);
    }

    /// @notice Removes a custom guard for the calling Safe
    /// @param guard The guard contract address to remove
    function removeCustomGuard(address guard) external {
        customGuards[msg.sender] = false;
        guards[msg.sender].remove(guard);
        emit GuardRemoved(msg.sender, guard);
    }

    /// @notice Returns all queued transactions for a Safe
    /// @param safe The Safe address to query
    /// @return result Array of pending SafeTx structs
    function getQueuedTxs(address payable safe) public view returns (SafeTx[] memory result) {
        uint256 nonce = Safe(safe).nonce();
        uint256 count;
        uint256 maxNonce = maxNonces[safe];
        for (uint256 i = nonce; i <= maxNonce; ++i) {
            count += hashes[safe][i].length();
        }

        result = new SafeTx[](count);
        count = 0;
        for (uint256 i = nonce; i <= maxNonce; ++i) {
            uint256 length = hashes[safe][i].length();
            for (uint256 j = 0; j < length; ++j) {
                result[count] = txs[hashes[safe][i].at(j)];
                ++count;
            }
        }
    }
}
