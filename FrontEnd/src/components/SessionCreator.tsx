import React, { useState } from 'react';
import { openContractCall } from '@stacks/connect';
import { uintCV, stringAsciiCV, principalCV, ClarityType } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { useWallet } from '../lib/wallet';
import { loadConfig } from '../lib/config';

export function SessionCreator({ context }: { context: { address: string | null; network: string; inst: number } }) {
  const [code, setCode] = useState('W1D1');
  const [seq, setSeq] = useState(1);
  const [topic, setTopic] = useState('Introduction to Blockchain');
  const [badgeUri, setBadgeUri] = useState('ipfs://badge-1');
  const [expiresBlocks, setExpiresBlocks] = useState(1000);
  const [active, setActive] = useState(true);
  const [status, setStatus] = useState('');
  const { userSession } = useWallet();
  const cfg = loadConfig();

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!context.address) return setStatus('⚠️ Please connect your wallet first');
    if (!code.trim()) return setStatus('⚠️ Session code is required');
    if (!topic.trim()) return setStatus('⚠️ Topic is required');
    
    try {
      setStatus('⏳ Opening wallet for signature...');
      
      await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: cfg.contractAddress,
        contractName: cfg.contractName,
        functionName: 'create-session',
        functionArgs: [
          uintCV(context.inst),
          stringAsciiCV(code),
          uintCV(seq),
          stringAsciiCV(topic),
          uintCV(0), // date
          stringAsciiCV(badgeUri),
          uintCV(expiresBlocks),
          active ? { type: ClarityType.BoolTrue } : { type: ClarityType.BoolFalse },
          principalCV(context.address),
        ],
        onFinish: (data) => {
          setStatus(`✅ Session created! TX: ${data.txId}`);
          // Reset form
          setCode('W1D1');
          setSeq(seq + 1);
          setTopic('');
          setBadgeUri('ipfs://badge-1');
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
      <h3 className="text-2xl font-bold text-white mb-6">🎓 Create Class Session</h3>
      <form onSubmit={onCreate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
              Session Code
            </label>
            <input 
              className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-purple-500/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none"
              placeholder="W1D1" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
              Sequence Number
            </label>
            <input 
              className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-purple-500/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none"
              type="number" 
              value={seq} 
              onChange={e => setSeq(Number(e.target.value))} 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
              Topic
            </label>
            <input 
              className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-purple-500/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none"
              placeholder="e.g., Understanding the Bitcoin Whitepaper" 
              value={topic} 
              onChange={e => setTopic(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
              Badge URI (IPFS)
            </label>
            <input 
              className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-purple-500/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none"
              placeholder="ipfs://..." 
              value={badgeUri} 
              onChange={e => setBadgeUri(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
              Expires At (Block Height)
            </label>
            <input 
              className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-purple-500/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none"
              type="number" 
              value={expiresBlocks} 
              onChange={e => setExpiresBlocks(Number(e.target.value))} 
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <input 
              className="w-5 h-5 rounded bg-white/10 border-2 border-white/20 checked:bg-purple-600 checked:border-purple-600 cursor-pointer transition-all duration-300"
              type="checkbox" 
              id="session-active"
              checked={active} 
              onChange={e => setActive(e.target.checked)} 
            />
            <label htmlFor="session-active" className="text-sm font-semibold text-gray-300 uppercase tracking-wide cursor-pointer">
              Session Active
            </label>
          </div>
        </div>
        <button 
          type="submit" 
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/40 hover:shadow-xl hover:shadow-purple-500/60 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
        >
          + Create Session
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
