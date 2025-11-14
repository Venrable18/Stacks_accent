import React, { useState } from 'react';
import { openContractCall } from '@stacks/connect';
import { uintCV, stringAsciiCV } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { useWallet } from '../lib/wallet';
import { loadConfig } from '../lib/config';
import { info, warn, error, txSuccess, txPending } from '../lib/toast';
import { emit } from '../lib/events';
import { getSessionSummary, fetchChainTipHeight } from '../lib/stacks';
import { waitForTx } from '../lib/txWatcher';

export function AttendanceClaimer({ context }: { context: { address: string | null; inst: number } }) {
  const [code, setCode] = useState('');
  const { userSession } = useWallet();
  const cfg = loadConfig();

  async function onClaim(e: React.FormEvent) {
    e.preventDefault();
  if (!context.address) return warn('Please connect your wallet first');
  if (!code.trim()) return warn('Enter a session code');
    
    try {
      // Validate session before broadcasting
      const trimmed = code.trim();
      let session;
      try {
        session = await getSessionSummary(context.inst, trimmed);
      } catch (netErr: any) {
        console.error('getSessionSummary failed', netErr);
        return error('Network error reaching Stacks API. Please check your connection and try again.');
      }
      if (!session.exists) return warn('Unknown session code');
      if (session.active === false) return warn('Session inactive');
      if (typeof session.expiresAt === 'number') {
        try {
          const tip = await fetchChainTipHeight();
          if (tip > session.expiresAt) return warn('Session expired');
        } catch (e) {
          // If chain height fetch fails, proceed without expiry check
          console.warn('fetchChainTipHeight failed; skipping expiry pre-check');
        }
      }

      txPending('attendance');
      
      const network = cfg.network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
      await openContractCall({
        network,
        contractAddress: cfg.contractAddress,
        contractName: cfg.contractName,
        functionName: 'claim-attendance',
  functionArgs: [uintCV(context.inst), stringAsciiCV(trimmed)],
        onFinish: async (data) => {
          try {
            // Wait for confirmation result
            const result = await waitForTx(data.txId, cfg.hiroApi);
            if (result.ok) {
              txSuccess(data.txId, 'attendance');
              setCode('');
              emit('nft:refresh', { reason: 'claim-confirmed' });
            } else {
              error(result.reason || 'Transaction failed');
            }
          } catch (watchErr: any) {
            console.error('waitForTx failed', watchErr);
            error('Network error waiting for confirmation. Check explorer for status.');
          }
        },
        onCancel: () => {
          error('Transaction cancelled');
        },
      });
    } catch (err: any) {
      error(`Error: ${err?.message || String(err)}`);
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-lg shadow-black/20">
      <h3 className="text-2xl font-bold text-white mb-6">✓ Claim Your Attendance</h3>
      <form onSubmit={onClaim} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            Session Code
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-green-500/50 focus:border-green-600 focus:ring-2 focus:ring-green-500/20 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none"
            placeholder="e.g., W1D1" 
            value={code} 
            onChange={e => setCode(e.target.value)} 
          />
        </div>
        <button 
          type="submit" 
          className="w-full px-6 py-4 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
        >
          ✓ Claim Attendance
        </button>
        {/* Toasts displayed globally */}
      </form>
    </div>
  );
}

// (Replaced polling with waitForTx utility)
