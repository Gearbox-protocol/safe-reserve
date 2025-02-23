// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeTx} from "./Types.sol";

interface IGuard {
    function checkTransaction(SafeTx calldata safeTx) external view;
}
