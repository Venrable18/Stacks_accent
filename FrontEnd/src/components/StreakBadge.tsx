import React from 'react';
import { fetchCurrentStreak, fetchStreakAwarded } from '../lib/stacks';

export function StreakBadge({ context }: { context: { address: string | null; network: string; inst: number; threshold: number } }) {
  const [streak, setStreak] = React.useState<number | null>(null);
  const [awarded, setAwarded] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    if (!context.address) return;
    setLoading(true);
    setError(null);
    try {
      const s = await fetchCurrentStreak(context.inst, context.address);
      const a = await fetchStreakAwarded(context.inst, context.address);
      setStreak(s);
      setAwarded(a);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [context.address, context.inst]);

  const currentStreak = streak ?? 0;
  const progressPercent = Math.min((currentStreak / context.threshold) * 100, 100);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            🔥 Your Streak
          </h3>
          {loading && <p className="text-gray-400">Loading streak data...</p>}
          {error && <p className="text-red-500">⚠️ {error}</p>}
          {!loading && !error && (
            <>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {currentStreak}
                </span>
                <span className="text-2xl text-gray-500">/ {context.threshold}</span>
              </div>
              <div className="mb-2">
                <div className="h-3 bg-white/10 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500 relative overflow-hidden"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-center justify-center text-center">
          {awarded ? (
            <>
              <span className="text-7xl mb-4 animate-float">🏆</span>
              <div className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                BADGE EARNED!
              </div>
            </>
          ) : (
            <>
              <span className="text-7xl mb-4 opacity-30">🎖️</span>
              <div className="text-lg font-semibold text-gray-400">
                {currentStreak > 0 
                  ? `${context.threshold - currentStreak} MORE!` 
                  : 'START YOUR JOURNEY'}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
