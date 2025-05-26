import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getTokenContract, getNFTContract } from '../utils/ethers';
import styles from './RewardSystem.module.css';

interface MintEvent {
  tokenId: number;
  creator: string;
  reward: string;
  timestamp: number;
}

export const RewardSystem = ({ address }: { address: string }) => {
  const [balance, setBalance] = useState<string>('0');
  const [mintEvents, setMintEvents] = useState<MintEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;
      
      try {
        // Get token balance
        const tokenContract = await getTokenContract();
        const balanceWei = await tokenContract.balanceOf(address);
        setBalance(ethers.formatEther(balanceWei));

        // Get mint events
        const nftContract = await getNFTContract();
        const filter = nftContract.filters.NFTMintedWithReward();
        const events = await nftContract.queryFilter(filter);
        
        const formattedEvents = events
          .filter((event): event is ethers.EventLog => 'args' in event)
          .map(event => ({
            tokenId: Number(event.args[0]),
            creator: event.args[1] as string,
            reward: ethers.formatEther(event.args[2]),
            timestamp: event.blockNumber
          }));

        setMintEvents(formattedEvents);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reward data:', err);
        setError('Failed to load reward data');
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  if (loading) return <div className={styles.loading}>Loading reward data...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.balance}>
        <h3>Token Balance</h3>
        <p>{balance} REWARD</p>
      </div>

      <div className={styles.history}>
        <h3>Minting History</h3>
        {mintEvents.length === 0 ? (
          <p>No minting history found</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Token ID</th>
                <th>Creator</th>
                <th>Reward</th>
              </tr>
            </thead>
            <tbody>
              {mintEvents.map((event) => (
                <tr key={event.tokenId}>
                  <td>{event.tokenId}</td>
                  <td>
                    {event.creator.slice(0, 6)}...{event.creator.slice(-4)}
                  </td>
                  <td>{event.reward} REWARD</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}; 