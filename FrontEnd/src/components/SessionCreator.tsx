import React, { useState } from 'react';
import { openContractCall } from '@stacks/connect';
import { uintCV, stringAsciiCV, principalCV, ClarityType } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { useWallet } from '../lib/wallet';
import { loadConfig } from '../lib/config';
import { humanizeBlocks, presetToBlocks, DurationPreset } from '../lib/blocktime';
import { getSessionSummary, fetchChainTipHeight } from '../lib/stacks';
import { waitForTx } from '../lib/txWatcher';
import { info, warn, error, txSuccess, txPending } from '../lib/toast';

export function SessionCreator({ context }: { context: { address: string | null; network: string; inst: number } }) {
  const [code, setCode] = useState('W1D1');
  const [seq, setSeq] = useState(1);
  const [topic, setTopic] = useState('Introduction to Blockchain');
  const [badgeUri, setBadgeUri] = useState('ipfs://badge-1');
  const [expiresBlocks, setExpiresBlocks] = useState(1);
  const [durationPreset, setDurationPreset] = useState<DurationPreset>('10m');
  const [active, setActive] = useState(true);
  const { userSession } = useWallet();
  const cfg = loadConfig();

  const applyPreset = (preset: DurationPreset) => {
    setDurationPreset(preset);
    if (preset !== 'custom') {
      setExpiresBlocks(presetToBlocks(preset));
    }
  };

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
  if (!context.address) return warn('Please connect your wallet first');
  if (!code.trim()) return warn('Session code is required');
  if (!topic.trim()) return warn('Topic is required');
    
    try {
      txPending('session');
      
      const network = cfg.network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

      // Duplicate code pre-check
      const existing = await getSessionSummary(context.inst, code.trim());
      if (existing.exists) {
        return warn('A session with this code already exists for this institution');
      }

      // Compute absolute expiry: current chain tip + duration blocks
      const tip = await fetchChainTipHeight();
      if (!tip || tip <= 0) {
        return error('Could not fetch current chain height. Please try again in a moment.');
      }
      const absoluteExpiry = tip + expiresBlocks; // off-chain calculation

      await openContractCall({
        network,
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
          uintCV(absoluteExpiry),
          active ? { type: ClarityType.BoolTrue } : { type: ClarityType.BoolFalse },
          principalCV(context.address),
        ],
        onFinish: async (data) => {
          const result = await waitForTx(data.txId, cfg.hiroApi);
          if (result.ok) {
            txSuccess(data.txId, 'session');
            // Reset form
            setCode('W1D1');
            setSeq(seq + 1);
            setTopic('');
            setBadgeUri('ipfs://badge-1');
          } else {
            error(result.reason || 'Session creation failed');
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

  if (!context.address) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-lg shadow-black/20">
        <h3 className="text-2xl font-bold text-white mb-6">🎓 Create Class Session</h3>
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
              <div className="h-12 bg-white/10 rounded-xl"></div>
            </div>
            <div>
              <div className="h-4 bg-white/10 rounded w-40 mb-2"></div>
              <div className="h-12 bg-white/10 rounded-xl"></div>
            </div>
            <div className="md:col-span-2">
              <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
              <div className="h-12 bg-white/10 rounded-xl"></div>
            </div>
            <div>
              <div className="h-4 bg-white/10 rounded w-36 mb-2"></div>
              <div className="h-12 bg-white/10 rounded-xl"></div>
            </div>
          </div>
          <div className="h-14 bg-white/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-lg shadow-black/20">
      <h3 className="text-2xl font-bold text-white mb-6">🎓 Create Class Session</h3>
      <form onSubmit={onCreate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
              Session Code
            </label>
            <input 
              className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-green-500/50 focus:border-green-600 focus:ring-2 focus:ring-green-500/20 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none"
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
              className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-green-500/50 focus:border-green-600 focus:ring-2 focus:ring-green-500/20 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none"
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
              className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-green-500/50 focus:border-green-600 focus:ring-2 focus:ring-green-500/20 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none"
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
              className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-green-500/50 focus:border-green-600 focus:ring-2 focus:ring-green-500/20 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none"
              placeholder="ipfs://..." 
              value={badgeUri} 
              onChange={e => setBadgeUri(e.target.value)} 
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Expires At (Block Height)
              </label>
              <span
                className="text-xs text-gray-400 cursor-help px-2 py-1 rounded bg-white/5 border border-white/10"
                title="Sessions expire when current block height passes this value. ~1 block ≈ 10 minutes on Stacks. Use presets for convenience or Custom to set an exact block count."
              >
                ⓘ Block Timing
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('10m')}
                  className={`px-3 py-2 rounded-lg text-sm border transition ${durationPreset === '10m' ? 'bg-green-700 text-white border-green-600' : 'bg-white/5 text-gray-300 border-white/10 hover:border-green-500/40'}`}
                >
                  10 min
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('1h')}
                  className={`px-3 py-2 rounded-lg text-sm border transition ${durationPreset === '1h' ? 'bg-green-700 text-white border-green-600' : 'bg-white/5 text-gray-300 border-white/10 hover:border-green-500/40'}`}
                >
                  1 hr
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('6h')}
                  className={`px-3 py-2 rounded-lg text-sm border transition ${durationPreset === '6h' ? 'bg-green-700 text-white border-green-600' : 'bg-white/5 text-gray-300 border-white/10 hover:border-green-500/40'}`}
                >
                  6 hr
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('1d')}
                  className={`px-3 py-2 rounded-lg text-sm border transition ${durationPreset === '1d' ? 'bg-green-700 text-white border-green-600' : 'bg-white/5 text-gray-300 border-white/10 hover:border-green-500/40'}`}
                >
                  1 day
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('custom')}
                  className={`px-3 py-2 rounded-lg text-sm border transition ${durationPreset === 'custom' ? 'bg-green-700 text-white border-green-600' : 'bg-white/5 text-gray-300 border-white/10 hover:border-green-500/40'}`}
                >
                  Custom
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  className={`w-full px-4 py-3 bg-white/5 border ${durationPreset === 'custom' ? 'border-white/10 hover:border-green-500/50 focus:border-green-600 focus:ring-2 focus:ring-green-500/20' : 'border-white/10 opacity-50 cursor-not-allowed'} rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none`}
                  type="number"
                  min={1}
                  value={expiresBlocks}
                  disabled={durationPreset !== 'custom'}
                  onChange={e => { setDurationPreset('custom'); setExpiresBlocks(Math.max(1, Number(e.target.value))); }}
                />
                <span className="text-sm text-gray-400 whitespace-nowrap" title="Approximate real-world duration based on ~10 min per block">≈ {humanizeBlocks(expiresBlocks)}</span>
              </div>
              {durationPreset !== 'custom' && (
                <div className="text-xs text-green-300/70">
                  Using preset <strong>{durationPreset}</strong> → {expiresBlocks} block{expiresBlocks === 1 ? '' : 's'}.
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-2 flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <input 
              className="w-5 h-5  rounded bg-white/10 border-2 border-white/20 checked:bg-green-600 checked:border-green-600 cursor-pointer transition-all duration-300"
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
          className="w-full px-6 py-4 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
        >
          + Create Session
        </button>
        {/* Toasts are shown globally via ToastContainer */}
      </form>
    </div>
  );
}

// fetchChainTipHeight imported from ../lib/stacks for consistency
