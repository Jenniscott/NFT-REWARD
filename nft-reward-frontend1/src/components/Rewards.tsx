import { useState, useEffect } from 'react';
import { getTokenContract } from '../utils/ethers';
import { ethers, EventLog } from 'ethers';
import styles from './Rewards.module.css';

interface RewardEvent {
  recipient: string;
  amount: string;
  timestamp: number;
}

export const Rewards = ({ address }: { address: string }) => {
  const [balance, setBalance] = useState('0');
  const [events, setEvents] = useState<RewardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [decimals, setDecimals] = useState(18);

  const fetchTokenInfo = async () => {
    try {
      const contract = await getTokenContract();
      const [symbol, decimals] = await Promise.all([
        contract.symbol(),
        contract.decimals()
      ]);
      setTokenSymbol(symbol);
      setDecimals(decimals);
    } catch (err) {
      console.error('Error fetching token info:', err);
    }
  };

  const fetchBalance = async () => {
    try {
      const contract = await getTokenContract();
      const rawBalance = await contract.balanceOf(address);
      setBalance(ethers.formatUnits(rawBalance, decimals));
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to load balance');
    }
  };

  const fetchRewardEvents = async () => {
    try {
      const contract = await getTokenContract();
      const filter = contract.filters.Transfer(null, address);
      const events = await contract.queryFilter(filter);

      const rewardEvents = await Promise.all(
        events.map(async (event) => {
          if (!('args' in event)) return null;
          const eventLog = event as EventLog;
          const block = await event.getBlock();
          return {
            recipient: eventLog.args[1],
            amount: ethers.formatUnits(eventLog.args[2], decimals),
            timestamp: block.timestamp,
          };
        })
      );

      setEvents(rewardEvents.filter((event): event is RewardEvent => event !== null));
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load reward events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchTokenInfo().then(() => {
        fetchBalance();
        fetchRewardEvents();
      });

      // Listen for new reward events
      const setupEventListener = async () => {
        const contract = await getTokenContract();
        contract.on('Transfer', (_from, to, amount) => {
          if (to.toLowerCase() === address.toLowerCase()) {
            const newEvent = {
              recipient: to,
              amount: ethers.formatUnits(amount, decimals),
              timestamp: Math.floor(Date.now() / 1000),
            };
            setEvents(prev => [newEvent, ...prev]);
            fetchBalance(); // Update balance when new rewards received
          }
        });
      };

      setupEventListener();

      return () => {
        // Cleanup event listener
        getTokenContract().then(contract => {
          contract.removeAllListeners('Transfer');
        });
      };
    }
  }, [address, decimals]);

  if (!address) return null;
  if (loading) return <div className={styles.loading}>Loading rewards...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.rewards}>
      <h2>Rewards</h2>
      
      <div className={styles.balance}>
        <h3>Token Balance</h3>
        <p>{balance} {tokenSymbol}</p>
      </div>

      <div className={styles.history}>
        <h3>Reward History</h3>
        {events.length === 0 ? (
          <p className={styles.empty}>No rewards received yet</p>
        ) : (
          <div className={styles.eventList}>
            {events.map((event, index) => (
              <div key={index} className={styles.event}>
                <p className={styles.amount}>{event.amount} {tokenSymbol}</p>
                <p className={styles.date}>
                  {new Date(event.timestamp * 1000).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 