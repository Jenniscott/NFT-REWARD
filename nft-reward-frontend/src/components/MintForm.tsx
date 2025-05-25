import { useState, ChangeEvent, FormEvent } from 'react';
import { uploadImageToPinata, uploadMetadataToPinata } from '../utils/pinata';
import { mintNFT } from '../utils/ethers';
import styles from '../styles/MintForm.module.css';

interface MintFormProps {
  onMintSuccess: (txHash: string) => void;
}

export const MintForm = ({ onMintSuccess }: MintFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !name || !description) return;

    try {
      setIsLoading(true);
      setError('');
      
      // Upload image to IPFS via Pinata
      const imageUrl = await uploadImageToPinata(file);
      console.log('Image uploaded:', imageUrl);
      
      // Upload metadata to IPFS via Pinata
      const metadataUrl = await uploadMetadataToPinata(name, description, imageUrl);
      console.log('Metadata uploaded:', metadataUrl);
      
      // Mint NFT with metadata URL
      const receipt = await mintNFT(metadataUrl);
      console.log('NFT minted:', receipt);
      
      onMintSuccess(receipt.hash);
      
      // Reset form
      setName('');
      setDescription('');
      setFile(null);
      setPreview('');
    } catch (error) {
      console.error('Error minting NFT:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error minting NFT. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      <input
        type="text"
        placeholder="NFT Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.input}
        required
      />
      
      <textarea
        placeholder="NFT Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={styles.input}
        required
      />
      
      <div className={styles.fileInput}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          required
        />
        {preview && (
          <img src={preview} alt="Preview" className={styles.preview} />
        )}
      </div>
      
      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading || !file || !name || !description}
      >
        {isLoading ? 'Minting...' : 'Mint NFT'}
      </button>
    </form>
  );
}; 