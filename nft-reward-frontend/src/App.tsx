import * as React from 'react';
import { ConnectWallet } from './components/ConnectWallet';
import { MintNFT } from './components/MintNFT';
import { NFTGallery } from './components/NFTGallery';
import styles from './styles/App.module.css';

const App = () => {
  const [address, setAddress] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleMintSuccess = (tokenId: string) => {
    alert(`NFT minted successfully! Token ID: ${tokenId}`);
  };

  // Add error handling
  const handleError = (error: Error) => {
    console.error('Application error:', error);
    setError(error.message);
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <ConnectWallet 
          address={address} 
          onConnect={setAddress} 
          onError={handleError}
        />
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to My NFT Hub</h1>

        {address ? (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Mint New NFT</h2>
              <MintNFT 
                onMintSuccess={handleMintSuccess} 
                onError={handleError}
              />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Your NFT Collection</h2>
              <NFTGallery onError={handleError} />
            </section>
          </>
        ) : (
          <div className={styles.connectPrompt}>
            Please connect your wallet to mint and view NFTs
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
