import React, { useState } from 'react';
import { uploadImageToPinata, uploadMetadataToPinata } from '../utils/pinata';
import { mintNFT } from '../utils/ethers';
import styles from './MintNFT.module.css';

interface MintNFTProps {
  onMintSuccess: (tokenId: string) => void;
  onError: (error: Error) => void;
}

export const MintNFT: React.FC<MintNFTProps> = ({ onMintSuccess, onError }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !name || !description) {
      onError(new Error('Please fill in all fields'));
      return;
    }

    setIsLoading(true);
    try {
      // Upload image to IPFS via Pinata
      const imageUrl = await uploadImageToPinata(file);
      
      // Upload metadata to IPFS
      const metadataUrl = await uploadMetadataToPinata(name, description, imageUrl);
      
      // Mint NFT
      const tokenId = await mintNFT(metadataUrl);
      onMintSuccess(tokenId);
      
      // Reset form
      setName('');
      setDescription('');
      setFile(null);
      setPreviewUrl('');
    } catch (error) {
      console.error('Error minting NFT:', error);
      onError(error instanceof Error ? error : new Error('Failed to mint NFT'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.imageUpload}>
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className={styles.preview} />
        ) : (
          <div className={styles.uploadPlaceholder}>
            <span>Click or drag to upload image</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
      </div>

      <div className={styles.inputGroup}>
        <input
          type="text"
          placeholder="NFT Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <textarea
          placeholder="NFT Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textarea}
          required
        />
      </div>

      <button
        type="submit"
        className={styles.mintButton}
        disabled={isLoading || !file || !name || !description}
      >
        {isLoading ? 'Minting...' : 'Mint NFT'}
      </button>
    </form>
  );
}; 