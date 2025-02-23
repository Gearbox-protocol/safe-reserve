// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Enum} from "@safe-smart-account/common/Enum.sol";

struct SafeTx {
    address to;
    uint256 value;
    bytes data;
    Enum.Operation operation;
    uint256 safeTxGas;
    uint256 baseGas;
    uint256 gasPrice;
    address gasToken;
    address refundReceiver;
    uint256 nonce;
}

struct SafeTxExtended {
    bytes32 hash;
    address[] signedBy;
    address to;
    uint256 value;
    bytes data;
    Enum.Operation operation;
    uint256 safeTxGas;
    uint256 baseGas;
    uint256 gasPrice;
    address gasToken;
    address refundReceiver;
    uint256 nonce;
}
