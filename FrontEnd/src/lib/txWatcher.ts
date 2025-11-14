// Lightweight transaction watcher that polls Hiro API for final status
// and extracts Clarity error codes like (err u101)

export interface TxWatchResult {
  ok: boolean;
  status: string;
  code?: number; // clarity error code, if any
  repr?: string; // raw tx_result repr
  reason?: string; // friendly
}

export async function waitForTx(
  txId: string,
  hiroApi: string,
  { maxTries = 30, intervalMs = 4000 }: { maxTries?: number; intervalMs?: number } = {}
): Promise<TxWatchResult> {
  const base = hiroApi.replace(/\/$/, '');
  for (let i = 0; i < maxTries; i++) {
    try {
      const res = await fetch(`${base}/extended/v1/tx/${txId}`);
      if (res.ok) {
        const j = await res.json();
        const status = String(j?.tx_status || 'unknown');
        if (status === 'pending') {
          // keep waiting
        } else if (status === 'success') {
          return { ok: true, status };
        } else {
          // failed; try to parse repr `(err uXYZ)`
          const repr: string | undefined = j?.tx_result?.repr || j?.event_error || undefined;
          const code = extractErrCode(repr);
          return { ok: false, status, code, repr, reason: code ? mapClarityErr(code) : mapStatus(status, repr) };
        }
      }
    } catch {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { ok: false, status: 'timeout', reason: 'Timed out waiting for confirmation' };
}

function extractErrCode(repr?: string): number | undefined {
  if (!repr) return undefined;
  const m = repr.match(/\(err\s+u(\d+)\)/);
  if (m) return Number(m[1]);
  return undefined;
}

function mapClarityErr(code: number): string {
  switch (code) {
    case 100:
      return 'No such session code (ERR-NO-SESSION)';
    case 101:
      return 'Duplicate claim: you have already claimed this session (ERR-DUP-CLAIM)';
    case 102:
      return 'Session is inactive (ERR-INACTIVE)';
    case 103:
      return 'Session expired (ERR-EXPIRED)';
    case 104:
      return 'Sequence number already taken for this institution (ERR-SEQ-TAKEN)';
    case 105:
      return 'Session with this code already exists (ERR-SESSION-EXISTS)';
    case 106:
      return 'Mint failed (ERR-MINT-FAILED)';
    default:
      return `Contract returned error code u${code}`;
  }
}

function mapStatus(status: string, repr?: string): string {
  if (status === 'abort_by_post_condition') return 'Aborted by a post-condition';
  if (status === 'abort_by_response') return `Contract aborted: ${repr || 'unknown error'}`;
  return `Transaction failed: ${status}`;
}
