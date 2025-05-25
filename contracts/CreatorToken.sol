// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CreatorToken is ERC20, Ownable {
    constructor() ERC20("CreatorToken", "CRT") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10**18); // Mint 1M tokens to owner
    }

    // Allow the owner (e.g., NFT contract) to transfer tokens as rewards
    function transferReward(address to, uint256 amount) external onlyOwner {
        require(balanceOf(owner()) >= amount, "Insufficient tokens to reward");
        _transfer(owner(), to, amount);
    }
}
