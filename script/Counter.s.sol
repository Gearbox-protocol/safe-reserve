// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {SafeStorage} from "../src/SafeStorage.sol";

contract SafeStorageScript is Script {
    SafeStorage public safeStorage;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        safeStorage = new SafeStorage{salt: bytes32(0)}();

        vm.stopBroadcast();
    }
}
