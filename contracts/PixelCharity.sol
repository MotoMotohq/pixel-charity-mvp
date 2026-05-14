// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PixelCharity is Ownable {
    uint256 public constant MAX_PIXELS = 1000;

    struct Donation {
        address donor;
        uint256 amount;
        string message;
        uint256 pixelIndex;
    }

    Donation[] private donations;
    mapping(uint256 => address) public pixelToDonor;

    event NewDonation(address indexed donor, uint256 indexed pixelIndex, uint256 amount, string message);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function donate(uint256 pixelIndex, string calldata message) external payable {
        require(msg.value > 0, "Donation must be > 0");
        require(pixelIndex < MAX_PIXELS, "Pixel index must be 0..999");
        require(pixelToDonor[pixelIndex] == address(0), "Pixel already occupied");

        pixelToDonor[pixelIndex] = msg.sender;
        donations.push(
            Donation({donor: msg.sender, amount: msg.value, message: message, pixelIndex: pixelIndex})
        );

        emit NewDonation(msg.sender, pixelIndex, msg.value, message);
    }

    function getDonations() external view returns (Donation[] memory) {
        return donations;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdraw failed");
    }
}
