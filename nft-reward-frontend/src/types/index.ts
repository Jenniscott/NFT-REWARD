export interface NFT {
  tokenId: string;
  tokenURI: string;
  creator: string;
  metadata?: NFTMetadata;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  created_at?: string;
}

export interface RewardEvent {
  tokenId: string;
  creator: string;
  reward: string;
  timestamp?: number;
}

export interface MintFormProps {
  onMintSuccess: (txHash: string) => void;
}

export interface WalletInfo {
  address: string;
  tokenBalance: string;
  nftBalance: string;
} 