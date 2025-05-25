import React from 'react';
import { connectWallet } from '../utils/ethers';
import styles from './ConnectWallet.module.css';

interface ConnectWalletProps {
  address: string;
  onConnect: (address: string) => void;
  onError: (error: Error) => void;
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({ address, onConnect, onError }) => {
  const handleConnect = async () => {
    try {
      const userAddress = await connectWallet();
      onConnect(userAddress);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      onError(error instanceof Error ? error : new Error('Failed to connect wallet'));
    }
  };

  return (
    <div className={styles.container}>
      {address ? (
        <div className={styles.addressContainer}>
          <span className={styles.label}>Connected:</span>
          <span className={styles.address}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
      ) : (
        <button className={styles.connectButton} onClick={handleConnect}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}; 