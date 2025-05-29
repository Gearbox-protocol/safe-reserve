// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SignedTx} from "./Types.sol";

interface IGuard {
    function checkTransaction(SignedTx calldata safeTx) external view;
}
