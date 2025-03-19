// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28; 

contract Test {
    uint a;

    function getAddress() public returns (address) {
        a += 1;
        return address(this);
    }
}