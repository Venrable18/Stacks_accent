import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { WalletProvider } from './lib/wallet';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary>
    <WalletProvider>
      <>
        <App />
        <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop limit={3} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      </>
    </WalletProvider>
  </ErrorBoundary>
);
