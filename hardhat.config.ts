import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "v0.8.17", 
  networks: {
    'lisk-sepolia-testnet': {
      url: 'https://rpc.sepolia-api.lisk.com',
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
  etherscan: {
    apiKey: {
      'lisk-sepolia-testnet': 'empty'
    },
    customChains: [
      {
        network: "lisk-sepolia-testnet",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com"
        }
      }
    ]
  }
};

export default config;