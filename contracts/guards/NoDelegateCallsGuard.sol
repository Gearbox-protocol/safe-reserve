// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IGuard} from "../interfaces/IGuard.sol";
import {SafeTx} from "../interfaces/Types.sol";
import {Enum} from "@safe-smart-account/common/Enum.sol";

/// @title NoDelegateCalls - A guard that prevents delegate calls except to whitelisted addresses
/// @notice This guard checks transactions to ensure no delegate calls are made except to allowed addresses

contract NoDelegateCallsGuard is IGuard {
    // Mapping to store allowed delegate call targets
    address immutable allowedTarget;

    constructor(address _allowedTarget) {
        allowedTarget = _allowedTarget;
    }

    function checkTransaction(SafeTx calldata safeTx) external view override {
        // Only check delegate calls
        if (safeTx.operation == Enum.Operation.DelegateCall) {
            require(safeTx.to == allowedTarget, "Delegate call to non-whitelisted address");
        }
    }
}
