export interface AppConfig {
  network: 'testnet' | 'mainnet' | 'devnet';
  contractAddress: string;
  contractName: string;
  streakThreshold: number;
  hiroApi: string;
}

export const loadConfig = (): AppConfig => {
  const network = (import.meta.env.VITE_STACKS_NETWORK || 'testnet') as AppConfig['network'];
  return {
    network,
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '',
    contractName: import.meta.env.VITE_CONTRACT_NAME || 'Attendance',
    streakThreshold: Number(import.meta.env.VITE_STREAK_THRESHOLD || 15),
    hiroApi: import.meta.env.VITE_HIRO_API || 'https://api.testnet.hiro.so',
  };
};
