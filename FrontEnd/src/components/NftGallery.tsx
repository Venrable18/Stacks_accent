import React from 'react';
import { fetchNextAttendanceId, fetchAttendanceOwner, fetchAttendanceTokenUri } from '../lib/stacks';

export function NftGallery({ context }: { context: { address: string | null; inst: number } }) {
  const [items, setItems] = React.useState<{ id: number; uri: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    if (!context.address) return;
    setLoading(true);
    setError(null);
    try {
      const nextId = await fetchNextAttendanceId();
      const owned: { id: number; uri: string }[] = [];
      // Scan from 1..nextId-1
      for (let id = 1; id < nextId; id++) {
        const owner = await fetchAttendanceOwner(id);
        if (owner && owner === context.address) {
          const uriJson = await fetchAttendanceTokenUri(id);
          const uri = uriJson.type === 'some' ? (uriJson.value as string) : '';
          owned.push({ id, uri });
        }
      }
      setItems(owned);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [context.address]);

  // Extract topic from URI or use placeholder
  const getTopicFromUri = (uri: string) => {
    // For now, use the URI itself as a topic placeholder
    // In production, you'd fetch metadata JSON from IPFS
    if (uri.includes('bitcoin')) return 'Topic: Understanding the Bitcoin Whitepaper';
    if (uri.includes('remix')) return 'Topic: Developer Tools - Remix, Foundry, Hardhat';
    if (uri.includes('transaction')) return 'Topic: Transactions';
    if (uri.includes('ethereum')) return 'Topic: Ethereum Structure';
    if (uri.includes('gas')) return 'Topic: Gas and Fees';
    if (uri.includes('blockchain')) return 'Topic: Introduction to Blockchain and precontent overview';
    return `Session Badge ${uri.slice(0, 20)}...`;
  };

  const getImagePlaceholder = (id: number) => {
    // Rotate through some emoji placeholders
    const emojis = ['🎓', '📚', '💡', '🔗', '⛓️', '🌐'];
    return emojis[id % emojis.length];
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">🎨 Your Attendance NFTs</h2>
        <button 
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl transition-all duration-300 text-sm font-medium flex items-center gap-2"
          onClick={load}
        >
          🔄 Refresh
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading your collection...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">
          ⚠️ {error}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-6">🎫</div>
          <div className="text-2xl font-bold text-white mb-3">No NFTs Yet</div>
          <div className="text-gray-400">
            Start claiming attendance to build your collection
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(it => (
            <div key={it.id} className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1">
              <div className="relative aspect-square bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                  {getImagePlaceholder(it.id)}
                </div>
                <div className="absolute top-3 right-3 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-sm font-mono text-white">
                  #{it.id}
                </div>
              </div>
              <div className="p-5">
                <div className="text-sm text-gray-300 mb-4 line-clamp-2">
                  {getTopicFromUri(it.uri)}
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">NFT ID</div>
                    <div className="text-sm font-mono text-purple-400 font-semibold">
                      wk{it.id}day{it.id}
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50">
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
