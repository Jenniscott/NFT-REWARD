import { useState, useEffect } from 'react';
import { getNFTContract, getTokenContract } from '../utils/ethers';
import type { NFTMetadata } from '../utils/ethers';
import { ethers } from 'ethers';
import styles from './Gallery.module.css';

interface NFT extends NFTMetadata {
  tokenId: number;
  creator: string;
  reward?: string;
}

export const Gallery = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNFTs = async () => {
    try {
      const contract = await getNFTContract();
      const tokenIds = await contract.getAllTokenIds();
      
      const nftPromises = tokenIds.map((id: number) => fetchNFTData(Number(id)));
      const nftData = await Promise.all(nftPromises);
      setNfts(nftData.filter((nft): nft is NFT => nft !== null));
    } catch (err) {
      console.error(err);
      setError('Failed to load NFTs');
    } finally {
      setLoading(false);
    }
  };

  const fetchNFTData = async (tokenId: number): Promise<NFT | null> => {
    try {
      const contract = await getNFTContract();
      const [uri, creator] = await Promise.all([
        contract.tokenURI(tokenId),
        contract.getCreator(tokenId)
      ]);

      // Convert IPFS URI to HTTPS
      const httpsUri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      const response = await fetch(httpsUri);
      const metadata = await response.json();

      // Get reward amount for this NFT from events
      const filter = contract.filters.NFTMintedWithReward(tokenId);
      const events = await contract.queryFilter(filter);
      let reward;
      if (events.length > 0 && 'args' in events[0]) {
        reward = ethers.formatEther(events[0].args[2]);
      }

      return {
        tokenId,
        creator,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/'),
        reward
      };
    } catch (err) {
      console.error(`Error fetching NFT ${tokenId}:`, err);
      return null;
    }
  };

  useEffect(() => {
    fetchNFTs();

    // Listen for new mint events
    const setupEventListener = async () => {
      const contract = await getNFTContract();
      contract.on('NFTMintedWithReward', async (tokenId) => {
        const newNft = await fetchNFTData(Number(tokenId));
        if (newNft) {
          setNfts(prev => [...prev, newNft]);
        }
      });
    };

    setupEventListener();

    return () => {
      // Cleanup event listener
      getNFTContract().then(contract => {
        contract.removeAllListeners('NFTMintedWithReward');
      });
    };
  }, []);

  if (loading) return <div className={styles.loading}>Loading NFTs...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (nfts.length === 0) return <div className={styles.empty}>No NFTs found</div>;

  return (
    <div className={styles.gallery}>
      <h2>NFT Gallery</h2>
      <div className={styles.grid}>
        {nfts.map(nft => (
          <div key={nft.tokenId} className={styles.card}>
            <img src={nft.image} alt={nft.name} className={styles.image} />
            <div className={styles.details}>
              <h3>{nft.name}</h3>
              <p>{nft.description}</p>
              <p className={styles.creator}>
                Creator: {nft.creator.slice(0, 6)}...{nft.creator.slice(-4)}
              </p>
              <p className={styles.tokenId}>Token ID: {nft.tokenId}</p>
              {nft.reward && (
                <p className={styles.reward}>Reward: {nft.reward} tokens</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 