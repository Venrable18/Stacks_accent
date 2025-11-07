import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { WalletProvider } from './lib/wallet';
import './styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <WalletProvider>
    <App />
  </WalletProvider>
);
