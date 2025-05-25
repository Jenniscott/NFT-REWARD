import { ethers } from "hardhat";

async function main() {
  const CreatorToken = await ethers.getContractFactory("CreatorToken");
  const creatorToken = await CreatorToken.deploy();
  await creatorToken.waitForDeployment();
  console.log("CreatorToken deployed to:", await creatorToken.getAddress());

  const ArtNFT = await ethers.getContractFactory("ArtNFT");
  const artNFT = await ArtNFT.deploy(await creatorToken.getAddress());
  await artNFT.waitForDeployment();
  console.log("ArtNFT deployed to:", await artNFT.getAddress());

  // Optional: transfer ownership and fund reward pool
  await creatorToken.transferOwnership(await artNFT.getAddress());
  await creatorToken.transfer(await artNFT.getAddress(), ethers.parseEther("1000000"));
  console.log("Transferred token ownership and funded ArtNFT.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
