// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {Safe, Enum} from "@safe-smart-account/Safe.sol";
import {SafeStorage} from "../SafeStorage.sol";
import {SafeTx} from "../interfaces/Types.sol";
import {IGuard} from "../interfaces/IGuard.sol";
import {NoDelegateCallsGuard} from "../guards/NoDelegateCallsGuard.sol";
import {SafeProxyFactory} from "@safe-smart-account/proxies/SafeProxyFactory.sol";
import {SafeProxy} from "@safe-smart-account/proxies/SafeProxy.sol";

contract MockGuard is IGuard {
    bool public shouldRevert;

    function checkTransaction(SafeTx calldata) external view {
        require(!shouldRevert, "MockGuard: reverted");
    }

    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }
}

contract SafeStorageTest is Test {
    Safe public safe;
    SafeStorage public safeStorage;
    MockGuard public mockGuard;
    SafeProxyFactory public factory;
    Safe public singleton;

    address[] public owners;
    uint256 public threshold = 2;
    address public owner1 = makeAddr("owner1");
    address public owner2 = makeAddr("owner2");
    address public owner3 = makeAddr("owner3");
    address public nonOwner = makeAddr("nonOwner");

    event TransactionRegistered(address indexed safe, bytes32 indexed txHash, uint256 nonce);
    event TransactionExecuted(address indexed safe, bytes32 indexed txHash);
    event GuardAdded(address indexed safe, address indexed guard);
    event GuardRemoved(address indexed safe, address indexed guard);

    function setUp() public {
        // Setup owners
        owners.push(owner1);
        owners.push(owner2);
        owners.push(owner3);

        // Deploy singleton and factory
        singleton = new Safe();
        factory = new SafeProxyFactory();

        // Prepare initialization data
        bytes memory initializer = abi.encodeWithSelector(
            Safe.setup.selector,
            owners,
            threshold,
            address(0), // to
            bytes(""), // data
            address(0), // fallbackHandler
            address(0), // paymentToken
            0, // payment
            payable(address(0)) // paymentReceiver
        );

        // Deploy proxy
        SafeProxy proxy = factory.createProxyWithNonce(address(singleton), initializer, 0);
        safe = Safe(payable(address(proxy)));

        // Deploy SafeStorage and MockGuard
        safeStorage = new SafeStorage();
        mockGuard = new MockGuard();

        // Fund owners and safe
        vm.deal(owner1, 100 ether);
        vm.deal(owner2, 100 ether);
        vm.deal(owner3, 100 ether);
        vm.deal(address(safe), 100 ether);
    }

    function test_RegisterTx() public {
        SafeTx memory safeTx = SafeTx({
            to: address(0x123),
            value: 1 ether,
            data: "",
            operation: Enum.Operation.Call,
            safeTxGas: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: address(0),
            refundReceiver: payable(address(0)),
            nonce: safe.nonce()
        });

        vm.prank(owner1);
        bytes32 txHash = safeStorage.registerTx(payable(address(safe)), safeTx);

        assertTrue(txHash != bytes32(0), "Transaction should be registered");
    }

    function test_RevertWhen_NonOwnerRegistersTx() public {
        SafeTx memory safeTx = SafeTx({
            to: address(0x123),
            value: 1 ether,
            data: "",
            operation: Enum.Operation.Call,
            safeTxGas: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: address(0),
            refundReceiver: payable(address(0)),
            nonce: safe.nonce()
        });

        vm.prank(nonOwner);
        vm.expectRevert("Not a safe owner");
        safeStorage.registerTx(payable(address(safe)), safeTx);
    }

    function test_ExecuteTx() public {
        address recipient = makeAddr("recipient");
        uint256 amount = 1 ether;

        SafeTx memory safeTx = SafeTx({
            to: recipient,
            value: amount,
            data: "",
            operation: Enum.Operation.Call,
            safeTxGas: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: address(0),
            refundReceiver: payable(address(0)),
            nonce: safe.nonce()
        });

        // Register transaction
        vm.prank(owner1);
        bytes32 txHash = safeStorage.registerTx(payable(address(safe)), safeTx);

        // Approve transaction by owners
        vm.prank(owner1);
        safe.approveHash(txHash);

        vm.prank(owner2);
        safe.approveHash(txHash);

        uint256 recipientBalanceBefore = recipient.balance;

        // Execute transaction
        safeStorage.executeTx(payable(address(safe)), txHash);

        assertEq(recipient.balance - recipientBalanceBefore, amount, "Recipient should receive correct amount");
    }

    function test_RevertWhen_NotEnoughSignatures() public {
        SafeTx memory safeTx = SafeTx({
            to: address(0x123),
            value: 1 ether,
            data: "",
            operation: Enum.Operation.Call,
            safeTxGas: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: address(0),
            refundReceiver: payable(address(0)),
            nonce: safe.nonce()
        });

        vm.prank(owner1);
        bytes32 txHash = safeStorage.registerTx(payable(address(safe)), safeTx);

        // Only one owner approves
        vm.prank(owner1);
        safe.approveHash(txHash);

        vm.expectRevert("Not enough signatures");
        safeStorage.executeTx(payable(address(safe)), txHash);
    }

    function test_CustomGuards() public {
        // Add custom guard
        vm.prank(address(safe));
        safeStorage.addCustomGuard(address(mockGuard));

        address[] memory guards = safeStorage.getGuards(address(safe));
        assertEq(guards.length, 1, "Should have one custom guard");
        assertEq(guards[0], address(mockGuard), "Should be mock guard");

        // Remove custom guard
        vm.prank(address(safe));
        safeStorage.removeCustomGuard(address(mockGuard));

        guards = safeStorage.getGuards(address(safe));
        assertEq(guards.length, 0, "Should have no custom guards");
    }

    function test_RevertWhen_GuardRejects() public {
        // Add custom guard
        vm.prank(address(safe));
        safeStorage.addCustomGuard(address(mockGuard));

        // Make guard reject transactions
        mockGuard.setShouldRevert(true);

        SafeTx memory safeTx = SafeTx({
            to: address(0x123),
            value: 1 ether,
            data: "",
            operation: Enum.Operation.Call,
            safeTxGas: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: address(0),
            refundReceiver: payable(address(0)),
            nonce: safe.nonce()
        });

        vm.prank(owner1);
        vm.expectRevert("MockGuard: reverted");
        safeStorage.registerTx(payable(address(safe)), safeTx);
    }

    function test_GetQueuedTxs() public {
        // Register multiple transactions
        SafeTx memory safeTx1 = SafeTx({
            to: address(0x123),
            value: 1 ether,
            data: "",
            operation: Enum.Operation.Call,
            safeTxGas: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: address(0),
            refundReceiver: payable(address(0)),
            nonce: safe.nonce()
        });

        SafeTx memory safeTx2 = SafeTx({
            to: address(0x456),
            value: 2 ether,
            data: "",
            operation: Enum.Operation.Call,
            safeTxGas: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: address(0),
            refundReceiver: payable(address(0)),
            nonce: safe.nonce()
        });

        vm.startPrank(owner1);
        safeStorage.registerTx(payable(address(safe)), safeTx1);
        safeStorage.registerTx(payable(address(safe)), safeTx2);
        vm.stopPrank();

        SafeTx[] memory queuedTxs = safeStorage.getQueuedTxs(payable(address(safe)));
        assertEq(queuedTxs.length, 2, "Should have two queued transactions");
        assertEq(queuedTxs[0].value, 1 ether, "First tx should have correct value");
        assertEq(queuedTxs[1].value, 2 ether, "Second tx should have correct value");
    }

    function test_RevertWhen_InvalidNonce() public {
        SafeTx memory safeTx = SafeTx({
            to: address(0x123),
            value: 1 ether,
            data: "",
            operation: Enum.Operation.Call,
            safeTxGas: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: address(0),
            refundReceiver: payable(address(0)),
            nonce: safe.nonce() + 1 // Invalid nonce
        });

        vm.prank(owner1);
        bytes32 txHash = safeStorage.registerTx(payable(address(safe)), safeTx);

        vm.startPrank(owner1);
        safe.approveHash(txHash);
        vm.stopPrank();

        vm.startPrank(owner2);
        safe.approveHash(txHash);
        vm.stopPrank();

        // Expect the correct error message
        vm.expectRevert("Tx not found");
        safeStorage.executeTx(payable(address(safe)), txHash);
    }
}
