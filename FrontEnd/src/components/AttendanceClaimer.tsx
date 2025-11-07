import React, { useState } from 'react';
import { openContractCall } from '@stacks/connect';
import { uintCV, stringAsciiCV } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { useWallet } from '../lib/wallet';
import { loadConfig } from '../lib/config';

export function AttendanceClaimer({ context }: { context: { address: string | null; inst: number } }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<string>('');
  const { userSession } = useWallet();
  const cfg = loadConfig();

  async function onClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!context.address) return setStatus('⚠️ Please connect your wallet first');
    if (!code.trim()) return setStatus('⚠️ Enter a session code');
    
    try {
      setStatus('⏳ Opening wallet for signature...');
      
      await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: cfg.contractAddress,
        contractName: cfg.contractName,
        functionName: 'claim-attendance',
        functionArgs: [uintCV(context.inst), stringAsciiCV(code)],
        onFinish: (data) => {
          setStatus(`✅ Transaction submitted! TX: ${data.txId}`);
          setCode('');
        },
        onCancel: () => {
          setStatus('❌ Transaction cancelled');
        },
      });
    } catch (err: any) {
      setStatus(`❌ Error: ${err?.message || String(err)}`);
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
      <h3 className="text-2xl font-bold text-white mb-6">✓ Claim Your Attendance</h3>
      <form onSubmit={onClaim} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            Session Code
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-purple-500/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none"
            placeholder="e.g., W1D1" 
            value={code} 
            onChange={e => setCode(e.target.value)} 
          />
        </div>
        <button 
          type="submit" 
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/40 hover:shadow-xl hover:shadow-purple-500/60 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
        >
          ✓ Claim Attendance
        </button>
        {status && (
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300">
            {status}
          </div>
        )}
      </form>
    </div>
  );
}
