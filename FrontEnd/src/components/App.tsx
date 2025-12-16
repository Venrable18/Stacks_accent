import React, { useMemo, useState } from 'react';
import { loadConfig } from '../lib/config';
import { useWallet, WalletConnectButton } from '../lib/wallet';
import { AttendanceClaimer } from './AttendanceClaimer';
import { SessionCreator } from './SessionCreator';
import { NftGallery } from './NftGallery';
import { StreakBadge } from './StreakBadge';
import { ThemeToggle } from './ThemeToggle';
import { ErrorBoundary } from './ErrorBoundary';
import { HiHome, HiCheckCircle, HiPlusCircle, HiChartBar } from 'react-icons/hi';
import { IoSparkles } from 'react-icons/io5';
import { FaHandPaper } from 'react-icons/fa';

type ViewType = 'dashboard' | 'claim' | 'create' | 'stats';

export default function App() {
  const cfg = useMemo(() => loadConfig(), []);
  const { address, isConnected } = useWallet();
  const [inst, setInst] = useState<number>(1);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  const context = useMemo(() => ({ 
    address, 
    network: cfg.network,
    inst, 
    threshold: cfg.streakThreshold 
  }), [address, cfg.network, inst, cfg.streakThreshold]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen grid grid-cols-[280px_1fr] gap-6 p-6">
      {/* Sidebar */}
      <aside className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col shadow-lg shadow-black/20 animate-slide-in transition-all duration-300 overflow-hidden">
        <div className="mb-10 text-center px-8 pt-8">
          <div className="text-5xl mb-3">🎓</div>
          <div>
            <h2 className="text-2xl font-display font-bold text-white tracking-tight">ClassMate+</h2>
            <div className="text-xs text-gray-400 tracking-widest mt-1.5 font-medium">ATTENDANCE TRACKER</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          <div 
            className={`relative flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
              activeView === 'dashboard' 
                ? 'bg-green-700 text-white shadow-md shadow-green-500/20 scale-[1.02]' 
                : 'text-gray-300 hover:bg-white/5 hover:text-white hover:scale-[1.01]'
            }`}
            onClick={() => setActiveView('dashboard')}
          >
            <HiHome className="w-5 h-5 relative z-10" />
            <span className="relative z-10 font-medium">Dashboard</span>
            {activeView === 'dashboard' && (
              <div className="absolute inset-0 bg-white/10 rounded-2xl blur-sm"></div>
            )}
          </div>
          <div 
            className={`relative flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
              activeView === 'claim' 
                ? 'bg-green-700 text-white shadow-md shadow-green-500/20 scale-[1.02]' 
                : 'text-gray-300 hover:bg-white/5 hover:text-white hover:scale-[1.01]'
            }`}
            onClick={() => setActiveView('claim')}
          >
            <HiCheckCircle className="w-5 h-5 relative z-10" />
            <span className="relative z-10 font-medium">Claim Attendance</span>
            {activeView === 'claim' && (
              <div className="absolute inset-0 bg-white/10 rounded-2xl blur-sm"></div>
            )}
          </div>
          <div 
            className={`relative flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
              activeView === 'create' 
                ? 'bg-green-700 text-white shadow-md shadow-green-500/20 scale-[1.02]' 
                : 'text-gray-300 hover:bg-white/5 hover:text-white hover:scale-[1.01]'
            }`}
            onClick={() => setActiveView('create')}
          >
            <HiPlusCircle className="w-5 h-5 relative z-10" />
            <span className="relative z-10 font-medium">Create Session</span>
            {activeView === 'create' && (
              <div className="absolute inset-0 bg-white/10 rounded-2xl blur-sm"></div>
            )}
          </div>
          <div 
            className={`relative flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
              activeView === 'stats' 
                ? 'bg-green-700 text-white shadow-md shadow-green-500/20 scale-[1.02]' 
                : 'text-gray-300 hover:bg-white/5 hover:text-white hover:scale-[1.01]'
            }`}
            onClick={() => setActiveView('stats')}
          >
            <HiChartBar className="w-5 h-5 relative z-10" />
            <span className="relative z-10 font-medium">Statistics</span>
            {activeView === 'stats' && (
              <div className="absolute inset-0 bg-white/10 rounded-2xl blur-sm"></div>
            )}
          </div>
        </nav>

        <div className="mt-auto pt-4 pb-8 border-t border-white/10 flex justify-center px-8">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-col gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-lg shadow-black/20 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2 tracking-tight">
              {getGreeting()} {isConnected ? <IoSparkles className="inline text-yellow-400" /> : <FaHandPaper className="inline text-gray-400" />}
            </h1>
            <p className="text-base text-gray-400 font-medium">
              {isConnected 
                ? address ? `${address.slice(0, 8)}...${address.slice(-6)}` : `Institution ID: ${inst}`
                : 'Connect your wallet to get started'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Tiny Institution selector (non-intrusive) */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
              <label htmlFor="inst" className="text-xs text-gray-400 uppercase tracking-wide">Inst</label>
              <input
                id="inst"
                type="number"
                min={1}
                value={inst}
                onChange={(e) => setInst(Math.max(1, Number(e.target.value)))}
                className="w-20 px-2 py-1 bg-transparent text-white border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 text-sm"
                title="Institution ID"
              />
            </div>
            <WalletConnectButton />
          </div>
        </div>

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <>
            {isConnected ? (
              <>
                <ErrorBoundary fallback={
                  <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 shadow-lg">
                    <div className="text-center">
                      <div className="text-4xl mb-3">⚠️</div>
                      <h3 className="text-xl font-bold text-white mb-2">Streak Badge Error</h3>
                      <p className="text-sm text-gray-400">Unable to load streak data</p>
                    </div>
                  </div>
                }>
                  <StreakBadge context={context} />
                </ErrorBoundary>
                <ErrorBoundary fallback={
                  <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 shadow-lg">
                    <div className="text-center">
                      <div className="text-4xl mb-3">⚠️</div>
                      <h3 className="text-xl font-bold text-white mb-2">NFT Gallery Error</h3>
                      <p className="text-sm text-gray-400">Unable to load your NFT collection</p>
                    </div>
                  </div>
                }>
                  <NftGallery context={context} />
                </ErrorBoundary>
              </>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-lg shadow-black/20">
                <div className="text-center">
                  <div className="text-6xl mb-6">🔐</div>
                  <h2 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">Wallet Not Connected</h2>
                  <p className="text-base text-gray-400 leading-relaxed">
                    Connect your Stacks wallet to view your attendance records and streak
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Claim Attendance View */}
        {activeView === 'claim' && (
          <>
            {isConnected ? (
              <ErrorBoundary fallback={
                <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 shadow-lg">
                  <div className="text-center">
                    <div className="text-4xl mb-3">⚠️</div>
                    <h3 className="text-xl font-bold text-white mb-2">Claim Error</h3>
                    <p className="text-sm text-gray-400">Unable to load attendance claimer</p>
                  </div>
                </div>
              }>
                <AttendanceClaimer context={context} />
              </ErrorBoundary>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-lg shadow-black/20">
                <div className="text-center">
                  <div className="text-6xl mb-6">🔐</div>
                  <h2 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">Wallet Required</h2>
                  <p className="text-base text-gray-400 leading-relaxed">
                    Please connect your wallet to claim attendance
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Session View */}
        {activeView === 'create' && (
          <>
            {isConnected ? (
              <ErrorBoundary fallback={
                <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 shadow-lg">
                  <div className="text-center">
                    <div className="text-4xl mb-3">⚠️</div>
                    <h3 className="text-xl font-bold text-white mb-2">Session Creator Error</h3>
                    <p className="text-sm text-gray-400">Unable to load session creation form</p>
                  </div>
                </div>
              }>
                <SessionCreator context={context} />
              </ErrorBoundary>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-lg shadow-black/20">
                <div className="text-center">
                  <div className="text-6xl mb-6">🔐</div>
                  <div className="text-2xl font-bold text-white mb-3">Wallet Required</div>
                  <div className="text-gray-400">
                    Please connect your wallet to create sessions
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Stats View */}
        {activeView === 'stats' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-lg shadow-black/20">
            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-6 tracking-tight">Statistics & Analytics</h2>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-6">📈</div>
              <h3 className="text-2xl font-display font-bold text-white mb-3 tracking-tight">Coming Soon</h3>
              <p className="text-base text-gray-400 leading-relaxed">
                Detailed statistics and performance analytics will be available here
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
