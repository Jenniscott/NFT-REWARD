import { useState } from 'react'
import { WalletConnect } from './components/WalletConnect'
import { MintForm } from './components/MintForm'
import { Gallery } from './components/Gallery'
import { Rewards } from './components/Rewards'
import styles from './App.module.css'

const App = () => {
  const [address, setAddress] = useState('')

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Welcome to My NFT Hub</h1>
        <WalletConnect onAddressChange={setAddress} />
      </header>

      <main className={styles.main}>
        {address ? (
          <>
            <section className={styles.section}>
              <MintForm />
            </section>

            <section className={styles.section}>
              <Gallery />
            </section>

            <section className={styles.section}>
              <Rewards address={address} />
            </section>
          </>
        ) : (
          <div className={styles.connect}>
            Please connect your wallet to continue
          </div>
        )}
      </main>
    </div>
  )
}

export default App
