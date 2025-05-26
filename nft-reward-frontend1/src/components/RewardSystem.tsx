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
        console.log('Fetching token balance for address:', address);
        // Get token balance
        const tokenContract = await getTokenContract();
        console.log('Token contract initialized');
        const balanceWei = await tokenContract.balanceOf(address);
        console.log('Raw balance:', balanceWei.toString());
        setBalance(ethers.formatEther(balanceWei));
        console.log('Formatted balance:', ethers.formatEther(balanceWei));

        // Get mint events
        console.log('Initializing NFT contract');
        const nftContract = await getNFTContract();
        console.log('NFT contract initialized');
        const filter = nftContract.filters.NFTMintedWithReward();
        console.log('Filter created');
        const events = await nftContract.queryFilter(filter);
        console.log('Raw events:', events);
        
        const formattedEvents = events
          .filter((event): event is ethers.EventLog => 'args' in event)
          .map(event => ({
            tokenId: Number(event.args[0]),
            creator: event.args[1] as string,
            reward: ethers.formatEther(event.args[2]),
            timestamp: event.blockNumber
          }));
        console.log('Formatted events:', formattedEvents);

        setMintEvents(formattedEvents);
        setLoading(false);
      } catch (err) {
        console.error('Detailed error in fetchData:', err);
        if (err instanceof Error) {
          setError(`Failed to load reward data: ${err.message}`);
        } else {
          setError('Failed to load reward data: Unknown error');
        }
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