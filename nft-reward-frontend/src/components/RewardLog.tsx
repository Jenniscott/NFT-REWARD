import { useState, useEffect } from 'react';
import { listenToMintEvents } from '../utils/ethers';
import styles from '../styles/RewardLog.module.css';

interface RewardEvent {
  tokenId: string;
  creator: string;
  reward: string;
  timestamp?: number;
}

export const RewardLog = () => {
  const [events, setEvents] = useState<RewardEvent[]>([]);

  useEffect(() => {
    const unsubscribe = listenToMintEvents((event) => {
      setEvents((prevEvents) => [
        {
          tokenId: event.tokenId.toString(),
          creator: event.creator,
          reward: event.reward.toString(),
          timestamp: Date.now(),
        },
        ...prevEvents,
      ]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (events.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Reward History</h2>
        <div className={styles.empty}>No rewards found yet.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Reward History</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr className={styles.tr}>
              <th className={styles.th}>Token ID</th>
              <th className={styles.th}>Creator</th>
              <th className={styles.th}>Reward</th>
              <th className={styles.th}>Time</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={`${event.tokenId}-${event.timestamp}`} className={styles.tr}>
                <td className={styles.td}>
                  <span className={styles.tokenId}>{event.tokenId}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.address}>{event.creator}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.reward}>{event.reward} Tokens</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.timestamp}>
                    {event.timestamp
                      ? new Date(event.timestamp).toLocaleTimeString()
                      : '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 