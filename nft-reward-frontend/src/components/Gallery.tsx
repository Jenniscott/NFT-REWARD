import { useState, useEffect } from 'react';
import { getAllNFTs, connectWallet } from '../utils/ethers';
import styles from '../styles/Gallery.module.css';

interface NFT {
  tokenId: string;
  tokenURI: string;
  creator: string;
}

interface Metadata {
  name: string;
  description: string;
  image: string;
}

const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];

const getIPFSUrl = (ipfsUrl: string, gatewayIndex = 0): string => {
  if (!ipfsUrl) return '';
  if (ipfsUrl.startsWith('http')) return ipfsUrl;
  const cid = ipfsUrl.replace('ipfs://', '');
  return `${IPFS_GATEWAYS[gatewayIndex]}${cid}`;
};

export const Gallery = () => {
  const [nfts, setNfts] = useState<(NFT & { metadata?: Metadata })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        await connectWallet();
        setIsConnected(true);
      } catch (error) {
        console.error('Wallet connection error:', error);
        setError('Failed to connect to wallet. Please make sure MetaMask is installed and connected.');
        setIsLoading(false);
        return false;
      }
      return true;
    };

    const loadNFTs = async () => {
      try {
        setError('');
        setIsLoading(true);

        // First ensure wallet is connected
        const walletConnected = await initializeWallet();
        if (!walletConnected) return;

        console.log('Fetching NFTs...');
        const nftList = await getAllNFTs();
        console.log('NFT List:', nftList);
        
        if (!nftList || nftList.length === 0) {
          console.log('No NFTs found');
          setNfts([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch metadata for each NFT
        const nftsWithMetadata = await Promise.all(
          nftList.map(async (nft) => {
            try {
              console.log(`Fetching metadata for NFT ${nft.tokenId}...`);
              // Try each gateway until one works
              let metadata;
              let lastError;
              
              for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
                try {
                  const ipfsUrl = getIPFSUrl(nft.tokenURI, i);
                  console.log(`Trying gateway ${i + 1}/${IPFS_GATEWAYS.length}: ${ipfsUrl}`);
                  
                  const response = await fetch(ipfsUrl);
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  metadata = await response.json();
                  console.log(`Successfully fetched metadata for token ${nft.tokenId}:`, metadata);
                  break;
                } catch (e) {
                  lastError = e;
                  console.warn(`Gateway ${i + 1} failed:`, e);
                  continue;
                }
              }
              
              if (!metadata) {
                console.error(`Failed to fetch metadata for token ${nft.tokenId}:`, lastError);
                return {
                  ...nft,
                  metadata: {
                    name: `NFT #${nft.tokenId}`,
                    description: 'Metadata unavailable',
                    image: '/placeholder.png'
                  }
                };
              }
              
              return { ...nft, metadata };
            } catch (error) {
              console.error(`Error processing token ${nft.tokenId}:`, error);
              return {
                ...nft,
                metadata: {
                  name: `NFT #${nft.tokenId}`,
                  description: 'Error loading metadata',
                  image: '/placeholder.png'
                }
              };
            }
          })
        );
        
        console.log('NFTs with metadata:', nftsWithMetadata);
        setNfts(nftsWithMetadata);
      } catch (error) {
        console.error('Error loading NFTs:', error);
        setError(error instanceof Error ? error.message : 'Failed to load NFTs. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadNFTs();
  }, []);

  if (isLoading) {
    return <div className={styles.loading}>Loading NFTs...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={styles.error}>
        Please connect your wallet to view NFTs.
      </div>
    );
  }

  if (nfts.length === 0) {
    return <div className={styles.empty}>No NFTs found. Mint one to get started!</div>;
  }

  return (
    <div className={styles.gallery}>
      {nfts.map((nft) => (
        <div key={nft.tokenId} className={styles.card}>
          {nft.metadata?.image && (
            <img
              src={getIPFSUrl(nft.metadata.image)}
              alt={nft.metadata.name || `NFT #${nft.tokenId}`}
              className={styles.image}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                const currentGatewayIndex = IPFS_GATEWAYS.findIndex(gateway => 
                  img.src.startsWith(gateway)
                );
                if (currentGatewayIndex < IPFS_GATEWAYS.length - 1) {
                  console.log(`Retrying image with next gateway for NFT ${nft.tokenId}`);
                  img.src = getIPFSUrl(nft.metadata!.image, currentGatewayIndex + 1);
                } else {
                  console.warn(`All gateways failed for NFT ${nft.tokenId}, using placeholder`);
                  img.src = '/placeholder.png';
                  img.alt = 'Failed to load NFT image';
                }
              }}
            />
          )}
          <div className={styles.info}>
            <div className={styles.tokenId}>Token ID: {nft.tokenId}</div>
            {nft.metadata?.name && <div className={styles.name}>{nft.metadata.name}</div>}
            {nft.metadata?.description && (
              <div className={styles.description}>{nft.metadata.description}</div>
            )}
            <div className={styles.creator}>
              Creator: {nft.creator}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 