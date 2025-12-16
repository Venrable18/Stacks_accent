import React from 'react';
import { fetchNextAttendanceId, fetchAttendanceOwner, fetchAttendanceTokenUri } from '../lib/stacks';
import { info, warn } from '../lib/toast';
import { loadConfig } from '../lib/config';
import { on } from '../lib/events';

export function NftGallery({ context }: { context: { address: string | null; inst: number } }) {
  const [items, setItems] = React.useState<{ id: number; uri: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [nextScanStart, setNextScanStart] = React.useState<number | null>(null); // next lower token id to continue from
  const [hasMore, setHasMore] = React.useState(false);
  const PAGE_SIZE = 30; // tokens per scan batch
  const MAX_CONCURRENCY = 6; // parallel owner lookups
  const MIN_TARGET_ITEMS = 9; // background scan target (e.g., fill a 3x3 grid)
  const address = context.address;
  const cfg = React.useMemo(() => loadConfig(), []);
  const storageKey = React.useMemo(() => (address ? `nftCache:${cfg.network}:${address}` : ''), [address, cfg.network]);
  const bgRunsRef = React.useRef(0);

  const performBatch = React.useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      let start = nextScanStart;
      if (start === null) {
        const nextId = await fetchNextAttendanceId();
        start = nextId - 1; // newest minted token id
      }
      if (start < 1) {
        setHasMore(false);
        return;
      }
      const end = Math.max(1, start - PAGE_SIZE + 1); // inclusive
      const ids: number[] = [];
      for (let id = start; id >= end; id--) ids.push(id);

      // Process ids in chunks with limited concurrency
      const chunkResults: { id: number; uri: string }[] = [];
      for (let i = 0; i < ids.length; i += MAX_CONCURRENCY) {
        const slice = ids.slice(i, i + MAX_CONCURRENCY);
        const owners = await Promise.all(slice.map(id => fetchAttendanceOwner(id)));
        const ownedIds: number[] = [];
        owners.forEach((owner, idx) => {
          if (owner && owner === address) ownedIds.push(slice[idx]);
        });
        if (ownedIds.length) {
          const uriJsons = await Promise.all(ownedIds.map(id => fetchAttendanceTokenUri(id)));
          ownedIds.forEach((id, idx) => {
            const uriJson = uriJsons[idx];
            const uri = uriJson.type === 'some' ? (uriJson.value as string) : '';
            chunkResults.push({ id, uri });
          });
        }
      }
      // Merge and de-duplicate (in case of overlapping batches) then sort descending id
      const merged = [...items, ...chunkResults].reduce<Record<number, string>>((acc, cur) => {
        acc[cur.id] = cur.uri;
        return acc;
      }, {});
      const finalList = Object.entries(merged)
        .map(([id, uri]) => ({ id: Number(id), uri }))
        .sort((a, b) => b.id - a.id);
      setItems(finalList);
      // Determine if more pages exist
      const newNextStart = end - 1;
      setNextScanStart(newNextStart);
      setHasMore(newNextStart >= 1);
      if (chunkResults.length === 0 && finalList.length === 0) {
        // no results found yet; silent
      }
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [address, items, nextScanStart]);

  React.useEffect(() => {
    // Reset state when address changes
    setItems([]);
    setNextScanStart(null);
    setHasMore(false);
    bgRunsRef.current = 0;
    if (address) {
      // hydrate from cache first for quicker perceived load
      try {
        if (storageKey) {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const cached: { id: number; uri: string }[] = JSON.parse(raw);
            if (Array.isArray(cached)) setItems(cached);
          }
        }
      } catch {}
      performBatch();
    }
  }, [address, performBatch]);

  // Subscribe to refresh events (e.g., after claim confirmation)
  React.useEffect(() => {
    const off = on('nft:refresh', () => {
      setItems([]);
      setNextScanStart(null);
      setHasMore(false);
      bgRunsRef.current = 0;
      performBatch();
    });
    return off;
  }, [performBatch]);

  React.useEffect(() => {
    // persist cache when items change
    try {
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  }, [items, storageKey]);

  // Background auto-scan: continue loading batches until we reach a minimum
  React.useEffect(() => {
    if (!address) return;
    if (loading) return;
    if (!hasMore) return;
    if (items.length >= MIN_TARGET_ITEMS) return;
    if (bgRunsRef.current >= 5) return; // hard cap to avoid runaway background work

    const t = setTimeout(() => {
      bgRunsRef.current += 1;
      performBatch();
    }, 200); // small delay to keep UI responsive

    return () => clearTimeout(t);
  }, [address, loading, hasMore, items.length, performBatch]);

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
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-lg shadow-black/20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">🎨 Your Attendance NFTs</h2>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl transition-all duration-300 text-sm font-medium flex items-center gap-2"
            onClick={() => {
              setItems([]);
              setNextScanStart(null);
              setHasMore(false);
              performBatch();
            }}
          >
            🔄 Refresh
          </button>
          {hasMore && (
            <button
              className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2"
              onClick={performBatch}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Load More'}
            </button>
          )}
        </div>
      </div>

      {loading && items.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-white/10"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                <div className="flex justify-between items-center mt-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded w-16"></div>
                    <div className="h-3 bg-white/10 rounded w-20"></div>
                  </div>
                  <div className="h-8 w-16 bg-white/10 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && items.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-green-500/30 border-t-green-600 rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-gray-400">Loading more...</p>
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
          {hasMore && (
            <div className="mt-4 text-sm text-gray-400">
              Tip: Load more to scan older tokens.
            </div>
          )}
          {hasMore && (
            <div className="mt-6">
              <button
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl transition-all duration-300 text-sm font-medium"
                onClick={performBatch}
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(it => (
            <div key={it.id} className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-green-500/10 hover:-translate-y-1">
              <div className="relative aspect-square bg-green-600/20 flex items-center justify-center">
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
                    <div className="text-sm font-mono text-green-400 font-semibold">
                      wk{it.id}day{it.id}
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-md hover:shadow-green-500/20">
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {hasMore && !loading && items.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl transition-all duration-300 text-sm font-medium"
            onClick={performBatch}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
