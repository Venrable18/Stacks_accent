/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STACKS_NETWORK: 'testnet' | 'mainnet' | 'devnet'
  readonly VITE_CONTRACT_ADDRESS: string
  readonly VITE_CONTRACT_NAME: string
  readonly VITE_STREAK_THRESHOLD?: string
  readonly VITE_HIRO_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
