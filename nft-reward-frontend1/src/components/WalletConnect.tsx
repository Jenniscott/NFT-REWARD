import { useState, useEffect } from 'react';
import { connectWallet } from '../utils/ethers';
import styles from './WalletConnect.module.css';

interface WalletConnectProps {
  onAddressChange: (address: string) => void;
}

export const WalletConnect = ({ onAddressChange }: WalletConnectProps) => {
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleConnect = async () => {
    try {
      const account = await connectWallet();
      setAddress(account);
      onAddressChange(account);
      setError('');
    } catch (err) {
      setError('Failed to connect wallet');
      console.error(err);
    }
  };

  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            onAddressChange(accounts[0]);
          }
        })
        .catch(console.error);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        const newAddress = accounts[0] || '';
        setAddress(newAddress);
        onAddressChange(newAddress);
      });
    }
  }, [onAddressChange]);

  return (
    <div className={styles.container}>
      {error && <p className={styles.error}>{error}</p>}
      {address ? (
        <div className={styles.address}>
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </div>
      ) : (
        <button className={styles.button} onClick={handleConnect}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}; 