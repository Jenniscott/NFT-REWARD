import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { CreatorToken, ArtNFT } from "../typechain-types"; // ✅ Ensure correct path (may be `typechain-types` depending on your config)

describe("ArtNFT and CreatorToken contracts", function () {
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;

  let creatorToken: CreatorToken;
  let artNFT: ArtNFT;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy the CreatorToken (ERC20)
    const CreatorTokenFactory = await ethers.getContractFactory("CreatorToken");
    creatorToken = await CreatorTokenFactory.deploy() as CreatorToken;
    await creatorToken.waitForDeployment();

    // Deploy the ArtNFT contract with CreatorToken address as constructor arg
    const ArtNFTFactory = await ethers.getContractFactory("ArtNFT");
    artNFT = await ArtNFTFactory.deploy(await creatorToken.getAddress()) as ArtNFT;
    await artNFT.waitForDeployment();

    // Transfer ownership of CreatorToken to the ArtNFT contract
    await creatorToken.transferOwnership(await artNFT.getAddress());

    // Fund the NFT contract with CreatorTokens to reward users
    const rewardAmount = ethers.parseEther("1000000");
    await creatorToken.transfer(await artNFT.getAddress(), rewardAmount);
  });

  it("should mint an NFT and reward the creator", async function () {
    const userAddress = await user.getAddress();
    const artNFTConnected = artNFT.connect(user);

    const tokenURI = "https://example.com/token/1";

    const tx = await artNFTConnected.mintNFT(tokenURI);
    const receipt = await tx.wait();

    if (!receipt) throw new Error("Transaction failed");

    // Look for the NFTMintedWithReward event
    const event = receipt.logs.find((log) => {
      try {
        const parsedLog = artNFT.interface.parseLog(log as any);
        return parsedLog?.name === "NFTMintedWithReward";
      } catch {
        return false;
      }
    });

    expect(event, "NFTMintedWithReward event not emitted").to.not.be.undefined;

    const parsedEvent = artNFT.interface.parseLog(event as any);
    const [tokenId, creator, reward] = parsedEvent?.args || [];

    expect(creator).to.equal(userAddress);
    expect(tokenId).to.be.greaterThan(0);
    expect(reward.toString()).to.equal(ethers.parseEther("100").toString());

    // Validate ERC20 token reward
    const balance = await creatorToken.balanceOf(userAddress);
    expect(balance.toString()).to.equal(ethers.parseEther("100").toString());

    // Validate NFT ownership and URI
    expect(await artNFT.ownerOf(tokenId)).to.equal(userAddress);
    expect(await artNFT.tokenURI(tokenId)).to.equal(tokenURI);
  });
});
