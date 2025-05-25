import React, { useState, useEffect } from 'react';
import { getAllNFTs } from '../utils/ethers';
import styles from './NFTGallery.module.css';

interface NFT {
  tokenId: string;
  name: string;
  description: string;
  image: string;
}

interface NFTGalleryProps {
  onError: (error: Error) => void;
}

export const NFTGallery: React.FC<NFTGalleryProps> = ({ onError }) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNFTs = async () => {
      try {
        const rawNFTs = await getAllNFTs();
        
        // Transform NFTs and fetch metadata
        const transformedNFTs = await Promise.all(
          rawNFTs.map(async (nft) => {
            try {
              // Convert IPFS URI to HTTP URL
              const metadataUrl = nft.tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
              const response = await fetch(metadataUrl);
              if (!response.ok) {
                throw new Error(`Failed to fetch metadata: ${response.statusText}`);
              }
              
              const metadata = await response.json();
              return {
                tokenId: nft.tokenId,
                name: metadata.name || 'Untitled NFT',
                description: metadata.description || 'No description available',
                image: metadata.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '/placeholder.png'
              };
            } catch (error) {
              console.error(`Error fetching metadata for NFT ${nft.tokenId}:`, error);
              return {
                tokenId: nft.tokenId,
                name: 'Unknown NFT',
                description: 'Metadata unavailable',
                image: '/placeholder.png'
              };
            }
          })
        );

        setNfts(transformedNFTs);
      } catch (error) {
        console.error('Error loading NFTs:', error);
        onError(error instanceof Error ? error : new Error('Failed to load NFTs'));
      } finally {
        setIsLoading(false);
      }
    };

    loadNFTs();
  }, [onError]);

  if (isLoading) {
    return <div className={styles.loading}>Loading NFTs...</div>;
  }

  if (nfts.length === 0) {
    return <div className={styles.empty}>No NFTs found. Mint one to get started!</div>;
  }

  return (
    <div className={styles.gallery}>
      {nfts.map((nft) => (
        <div key={nft.tokenId} className={styles.card}>
          <div className={styles.imageContainer}>
            <img src={nft.image} alt={nft.name} className={styles.image} />
          </div>
          <div className={styles.info}>
            <h3 className={styles.name}>{nft.name}</h3>
            <p className={styles.description}>{nft.description}</p>
            <span className={styles.tokenId}>Token ID: {nft.tokenId}</span>
          </div>
        </div>
      ))}
    </div>
  );
}; 