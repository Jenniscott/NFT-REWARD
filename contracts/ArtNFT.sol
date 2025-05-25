// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface ICreatorToken {
    function transferReward(address to, uint256 amount) external;
}

contract ArtNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    ICreatorToken public creatorToken;
    uint256 public rewardAmount = 100 * 10**18; // 100 tokens with 18 decimals
    uint256[] private _allTokenIds;

    mapping(uint256 => address) private _creators;
    mapping(address => uint256) private _creatorNFTCount;

    event NFTMintedWithReward(uint256 indexed tokenId, address indexed creator, uint256 reward);

    constructor(address tokenAddress) ERC721("ArtNFT", "ART") Ownable(msg.sender) {
        creatorToken = ICreatorToken(tokenAddress);
    }

    function mintNFT(string memory uri) public returns (uint256) {
        require(bytes(uri).length > 0, "TokenURI cannot be empty");
        require(bytes(uri).length <= 2048, "TokenURI too long"); // Add reasonable max length

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // Update all state variables before external calls
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, uri);
        _creators[newTokenId] = msg.sender;
        _creatorNFTCount[msg.sender]++;
        _allTokenIds.push(newTokenId);

        // External call moved to the end (Checks-Effects-Interactions pattern)
        creatorToken.transferReward(msg.sender, rewardAmount);
        
        emit NFTMintedWithReward(newTokenId, msg.sender, rewardAmount);

        return newTokenId;
    }

    function getCreator(uint256 tokenId) public view returns (address) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _creators[tokenId];
    }

    function getCreatorCount(address creator) public view returns (uint256) {
        return _creatorNFTCount[creator];
    }

    function setRewardAmount(uint256 newAmount) public onlyOwner {
        require(newAmount > 0, "Reward amount must be greater than 0");
        rewardAmount = newAmount;
    }

    function getAllTokenIds() external view returns (uint256[] memory) {
    return _allTokenIds;
}

    // Override tokenURI
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    // Override supportsInterface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
