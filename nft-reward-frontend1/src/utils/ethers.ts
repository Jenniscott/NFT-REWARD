import { ethers } from 'ethers';
import NFTContract from '../contracts/NFT.json';
import TokenContract from '../contracts/Token.json';

// Contract addresses from environment variables
const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
const TOKEN_CONTRACT_ADDRESS = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;

// Get Ethereum provider and signer
export const getProvider = () => {
  if (!window.ethereum) throw new Error('Please install MetaMask');
  return new ethers.BrowserProvider(window.ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

// Contract instances
export const getNFTContract = async (withSigner = false) => {
  const provider = getProvider();
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(NFT_CONTRACT_ADDRESS, NFTContract as unknown as ethers.InterfaceAbi, signer);
  }
  return new ethers.Contract(NFT_CONTRACT_ADDRESS, NFTContract as unknown as ethers.InterfaceAbi, provider);
};

export const getTokenContract = async (withSigner = false) => {
  const provider = getProvider();
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TokenContract as unknown as ethers.InterfaceAbi, signer);
  }
  return new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TokenContract as unknown as ethers.InterfaceAbi, provider);
};

// Wallet connection
export const connectWallet = async () => {
  if (!window.ethereum) throw new Error('Please install MetaMask');
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
};

// Types
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
}

declare global {
  interface Window {
    ethereum: any;
  }
} 