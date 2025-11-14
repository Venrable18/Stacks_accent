import React, { useEffect, useState } from 'react';
import { AppConfig, showConnect, UserSession } from '@stacks/connect';
import { IoWallet, IoClose } from 'react-icons/io5';
import { loadConfig } from './config';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  userSession: UserSession;
}

export const WalletContext = React.createContext<WalletContextType>({
  address: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  userSession,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const cfg = loadConfig();
      const net = cfg.network === 'mainnet' ? 'mainnet' : 'testnet';
      setAddress(userData.profile.stxAddress[net]);
      setIsConnected(true);
    }
  }, []);

  const connect = () => {
    showConnect({
      appDetails: {
        name: 'ClassMate+',
        icon: window.location.origin + '/logo.png',
      },
      redirectTo: '/',
      onFinish: () => {
        const userData = userSession.loadUserData();
        const cfg = loadConfig();
        const net = cfg.network === 'mainnet' ? 'mainnet' : 'testnet';
        setAddress(userData.profile.stxAddress[net]);
        setIsConnected(true);
      },
      userSession,
    });
  };

  const disconnect = () => {
    userSession.signUserOut();
    setAddress(null);
    setIsConnected(false);
  };

  return (
    <WalletContext.Provider value={{ address, isConnected, connect, disconnect, userSession }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return React.useContext(WalletContext);
}

export function WalletConnectButton() {
  const { address, isConnected, connect, disconnect } = useWallet();

  if (isConnected && address) {
    return (
      <button 
        className="relative px-7 py-3.5 bg-gradient-to-r from-red-900 to-red-900 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-2xl shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 uppercase text-sm tracking-wider overflow-hidden"
        onClick={disconnect}
      >
        <span className="relative z-10 font-display font-semibold">Disconnect Wallet</span>
      </button>
    );
  }

  return (
    <button 
      className="relative px-7 py-3.5 bg-green-700 hover:bg-green-600 text-white font-semibold rounded-2xl shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-100 flex items-center gap-3 uppercase text-sm tracking-wider overflow-hidden group"
      onClick={connect}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300 pointer-events-none" />
      <IoWallet className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
      <span className="relative z-10 font-display font-semibold">Connect Wallet</span>
      <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-600" />
    </button>
  );
}
