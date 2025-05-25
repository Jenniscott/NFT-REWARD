import { useState } from 'react';
import axios from 'axios';
import { getNFTContract } from '../utils/ethers';
import type { NFTMetadata } from '../utils/ethers';
import styles from './MintForm.module.css';
import { ethers } from 'ethers';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;

export const MintForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const uploadToPinata = async (file: File) => {
    console.log('Starting file upload to Pinata...');
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    });

    console.log('File uploaded to Pinata:', response.data);
    return `ipfs://${response.data.IpfsHash}`;
  };

  const uploadMetadataToPinata = async (metadata: NFTMetadata) => {
    console.log('Starting metadata upload to Pinata:', metadata);
    const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    });

    console.log('Metadata uploaded to Pinata:', response.data);
    return `ipfs://${response.data.IpfsHash}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !description) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Starting NFT minting process...');
      
      // 1. Upload image to IPFS
      console.log('Uploading image to IPFS...');
      const imageUrl = await uploadToPinata(file);
      console.log('Image uploaded, URL:', imageUrl);

      // 2. Create and upload metadata
      console.log('Creating metadata...');
      const metadata: NFTMetadata = {
        name,
        description,
        image: imageUrl,
      };
      console.log('Uploading metadata to IPFS...');
      const metadataUrl = await uploadMetadataToPinata(metadata);
      console.log('Metadata uploaded, URL:', metadataUrl);

      // 3. Get contract instance
      console.log('Getting contract instance...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = await getNFTContract(true);
      
      // 4. Get current account
      const account = await signer.getAddress();
      console.log('Using account:', account);

      // 5. Check contract address
      const contractAddress = await contract.getAddress();
      console.log('NFT Contract address:', contractAddress);

      // 6. Mint NFT
      console.log('Minting NFT with URI:', metadataUrl);
      const tx = await contract.mintNFT(metadataUrl, { gasLimit: 500000 });
      console.log('Transaction sent:', tx.hash);
      
      console.log('Waiting for transaction confirmation...');
      const receipt = await provider.waitForTransaction(tx.hash);
      console.log('Transaction confirmed! Receipt:', receipt);

      setSuccess('NFT minted successfully!');
      setName('');
      setDescription('');
      setFile(null);
    } catch (err: any) {
      console.error('Detailed error:', err);
      let errorMessage = 'Failed to mint NFT';
      
      // Check for specific error types
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by user';
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds to complete transaction';
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      // Log additional error details
      if (err.transaction) {
        console.error('Transaction details:', err.transaction);
      }
      if (err.receipt) {
        console.error('Receipt details:', err.receipt);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>Mint New NFT</h2>
      
      <div className={styles.field}>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="image">Image:</label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={loading}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <button type="submit" disabled={loading} className={styles.button}>
        {loading ? 'Minting...' : 'Mint NFT'}
      </button>
    </form>
  );
}; 