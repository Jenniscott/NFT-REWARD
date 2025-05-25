import { ethers } from 'ethers';

import NFT_ABI from '../contracts/NFT.json';
import TOKEN_ABI from '../contracts/Token.json';

// Contract addresses from environment variables
const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
const TOKEN_CONTRACT_ADDRESS = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;

if (!NFT_CONTRACT_ADDRESS || !TOKEN_CONTRACT_ADDRESS) {
  throw new Error('Contract addresses not found in environment variables');
}

let provider: ethers.BrowserProvider | null = null;
let nftContract: ethers.Contract | null = null;
let tokenContract: ethers.Contract | null = null;

interface Log {
  data: string;
  topics: string[];
}

interface TransferEventArgs {
  from: string;
  to: string;
  tokenId: bigint;
}

interface TransferEvent {
  name: string;
  args: TransferEventArgs;
}

const initializeContracts = async () => {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask');
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
  tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, signer);
  
  return signer;
};

export const connectWallet = async () => {
  try {
    await window.ethereum?.request({ method: 'eth_requestAccounts' });
    const signer = await initializeContracts();
    return await signer.getAddress();
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw new Error('Failed to connect wallet: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const mintNFT = async (tokenURI: string): Promise<string> => {
  if (!nftContract) {
    await initializeContracts();
  }
  
  try {
    const tx = await nftContract!.mint(tokenURI);
    const receipt = await tx.wait();
    
    // Find the Transfer event
    for (const log of receipt.logs) {
      try {
        const parsed = nftContract!.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        
        if (parsed?.name === 'Transfer') {
          return parsed.args.tokenId.toString();
        }
      } catch {
        continue;
      }
    }

    throw new Error('No Transfer event found in transaction receipt');
  } catch (error) {
    console.error('Minting error:', error);
    throw error;
  }
};

export const getTokenBalance = async (address: string): Promise<string> => {
  if (!tokenContract) {
    await initializeContracts();
  }

  try {
    const balance = await tokenContract!.balanceOf(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw new Error('Failed to get token balance');
  }
};

export const getNFTBalance = async (address: string): Promise<string> => {
  if (!nftContract) {
    await initializeContracts();
  }

  try {
    const balance = await nftContract!.balanceOf(address);
    return balance.toString();
  } catch (error) {
    console.error('Error getting NFT balance:', error);
    throw new Error('Failed to get NFT balance');
  }
};

export const getAllNFTs = async () => {
  if (!nftContract) {
    await initializeContracts();
  }

  try {
    const signer = await provider!.getSigner();
    const address = await signer.getAddress();
    const balance = await nftContract!.balanceOf(address);
    const nfts = [];

    for (let i = 0; i < balance; i++) {
      try {
        const tokenId = await nftContract!.tokenOfOwnerByIndex(address, i);
        const tokenURI = await nftContract!.tokenURI(tokenId);
        let creator = address;
        
        try {
          creator = await nftContract!.getCreator?.(tokenId) || address;
        } catch {
          // If getCreator fails, use the owner's address
        }

        // Convert IPFS URI to HTTP URL for metadata
        const metadataUrl = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
        const response = await fetch(metadataUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }
        
        const metadata = await response.json();
        nfts.push({
          tokenId: tokenId.toString(),
          name: metadata.name || 'Untitled NFT',
          description: metadata.description || 'No description available',
          image: metadata.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '/placeholder.png',
          creator
        });
      } catch (error) {
        console.error(`Error fetching NFT metadata:`, error);
        // Add a placeholder for failed NFTs
        nfts.push({
          tokenId: i.toString(),
          name: 'Failed to Load NFT',
          description: 'Could not load NFT metadata',
          image: '/placeholder.png',
          creator: address
        });
      }
    }

    return nfts;
  } catch (error) {
    console.error('Error in getAllNFTs:', error);
    throw new Error('Failed to fetch NFTs: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const listenToMintEvents = (callback: (event: TransferEventArgs) => void) => {
  if (!nftContract) {
    throw new Error('Please connect wallet first');
  }

  try {
    const handleTransfer = (from: string, to: string, tokenId: bigint) => {
      callback({ from, to, tokenId });
    };

    nftContract.on('Transfer', handleTransfer);
    return () => {
      nftContract?.off('Transfer', handleTransfer);
    };
  } catch (error) {
    console.error('Error setting up event listener:', error);
    throw new Error('Failed to setup event listener');
  }
}; 