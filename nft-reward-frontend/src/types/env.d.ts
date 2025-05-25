/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PINATA_API_KEY: string
  readonly VITE_PINATA_SECRET_KEY: string
  readonly VITE_NFT_CONTRACT_ADDRESS: string
  readonly VITE_TOKEN_CONTRACT_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 