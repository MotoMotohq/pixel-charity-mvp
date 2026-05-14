// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AetherMeta — read-only metadata the React app can display via ethers.js
contract AetherMeta {
    string public constant name = "Aether Exchange";
    string public constant version = "1";
    uint256 public immutable deployedAt;

    constructor() {
        deployedAt = block.timestamp;
    }

    function label() external view returns (string memory) {
        return string.concat(name, " v", version);
    }
}
