import {
  ClarityType,
  makeContractCall,
  PostConditionMode,
  uintCV,
  stringAsciiCV,
  principalCV,
  cvToJSON,
  fetchCallReadOnlyFunction,
} from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { loadConfig } from './config';

const cfg = loadConfig();

const selectNetwork = () => (cfg.network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET);

// Helper to create a session transaction
export interface CreateSessionArgs {
  inst: number;
  code: string;
  seq: number;
  topic: string;
  date: number;
  badgeUri: string;
  expiresAt: number;
  active: boolean;
  tutor: string; // principal string
}

export async function buildCreateSessionTx(senderKey: string, args: CreateSessionArgs) {
  const network = selectNetwork();
  return makeContractCall({
    network,
    contractAddress: cfg.contractAddress,
    contractName: cfg.contractName,
    functionName: 'create-session',
    functionArgs: [
      uintCV(args.inst),
      stringAsciiCV(args.code),
      uintCV(args.seq),
      stringAsciiCV(args.topic),
      uintCV(args.date),
      stringAsciiCV(args.badgeUri),
      uintCV(args.expiresAt),
      args.active ? { type: ClarityType.BoolTrue } : { type: ClarityType.BoolFalse },
      principalCV(args.tutor),
    ],
    senderKey,
    postConditionMode: PostConditionMode.Allow,
  });
}

export async function buildClaimAttendanceTx(senderKey: string, inst: number, code: string) {
  const network = selectNetwork();
  return makeContractCall({
    network,
    contractAddress: cfg.contractAddress,
    contractName: cfg.contractName,
    functionName: 'claim-attendance',
    functionArgs: [uintCV(inst), stringAsciiCV(code)],
    senderKey,
    postConditionMode: PostConditionMode.Allow,
  });
}

// Read-only helpers
export async function fetchStreak(student: string, inst: number) {
  const network = selectNetwork();
  const res = await fetchCallReadOnlyFunction({
    contractAddress: cfg.contractAddress,
    contractName: cfg.contractName,
    functionName: 'get-streak',
    functionArgs: [principalCV(student), uintCV(inst)],
    network,
    senderAddress: student,
  });
  return cvToJSON(res).value as number;
}

// Aliases for clearer semantics in UI
export const fetchCurrentStreak = (inst: number, student: string) => fetchStreak(student, inst);

export async function fetchStreakAwarded(inst: number, student: string) {
  const network = selectNetwork();
  const res = await fetchCallReadOnlyFunction({
    contractAddress: cfg.contractAddress,
    contractName: cfg.contractName,
    functionName: 'get-streak-awarded',
    functionArgs: [principalCV(student), uintCV(inst)],
    network,
    senderAddress: student,
  });
  const json = cvToJSON(res);
  // get-streak-awarded returns bool
  return Boolean(json.value);
}

export async function fetchSession(inst: number, code: string) {
  const network = selectNetwork();
  const res = await fetchCallReadOnlyFunction({
    contractAddress: cfg.contractAddress,
    contractName: cfg.contractName,
    functionName: 'get-session',
    functionArgs: [uintCV(inst), stringAsciiCV(code)],
    network,
    senderAddress: cfg.contractAddress,
  });
  return cvToJSON(res);
}

export async function fetchAttendanceTokenUri(tokenId: number) {
  const network = selectNetwork();
  const res = await fetchCallReadOnlyFunction({
    contractAddress: cfg.contractAddress,
    contractName: cfg.contractName,
    functionName: 'get-attendance-token-uri',
    functionArgs: [uintCV(tokenId)],
    network,
    senderAddress: cfg.contractAddress,
  });
  return cvToJSON(res);
}

export async function fetchStreakTokenUri() {
  const network = selectNetwork();
  const res = await fetchCallReadOnlyFunction({
    contractAddress: cfg.contractAddress,
    contractName: cfg.contractName,
    functionName: 'get-streak-token-uri',
    functionArgs: [uintCV(1)],
    network,
    senderAddress: cfg.contractAddress,
  });
  return cvToJSON(res);
}

export async function fetchNextAttendanceId() {
  const network = selectNetwork();
  const res = await fetchCallReadOnlyFunction({
    contractAddress: cfg.contractAddress,
    contractName: cfg.contractName,
    functionName: 'get-next-attendance-id',
    functionArgs: [],
    network,
    senderAddress: cfg.contractAddress,
  });
  const json = cvToJSON(res);
  return Number(json.value);
}

export async function fetchAttendanceOwner(tokenId: number) {
  const network = selectNetwork();
  const res = await fetchCallReadOnlyFunction({
    contractAddress: cfg.contractAddress,
    contractName: cfg.contractName,
    functionName: 'get-attendance-owner',
    functionArgs: [uintCV(tokenId)],
    network,
    senderAddress: cfg.contractAddress,
  });
  const json = cvToJSON(res);
  // optional principal can be one of:
  // { type: 'some', value: 'SP...' }
  // { type: 'some', value: { type: 'principalStandard', value: 'SP...' } }
  if (json?.type === 'some') {
    const v = (json as any).value;
    if (typeof v === 'string') return v.trim();
    if (v && typeof v.value === 'string') return v.value.trim();
  }
  return null;
}

// Chain info helpers
export async function fetchChainTipHeight(): Promise<number> {
  const base = cfg.hiroApi.replace(/\/$/, '');
  try {
    // Prefer /extended/v1/info for stacks_tip_height
    const res = await fetch(`${base}/extended/v1/info`);
    if (res.ok) {
      const j = await res.json();
      if (typeof j?.stacks_tip_height === 'number') return j.stacks_tip_height;
    }
  } catch {}
  // Fallback: try /extended/v1/block
  try {
    const res2 = await fetch(`${base}/extended/v1/block`);
    if (res2.ok) {
      const j2 = await res2.json();
      if (typeof j2?.height === 'number') return j2.height;
    }
  } catch {}
  // Fallback: try legacy /v2/info
  try {
    const res3 = await fetch(`${base}/v2/info`);
    if (res3.ok) {
      const j3 = await res3.json();
      if (typeof j3?.stacks_tip_height === 'number') return j3.stacks_tip_height;
    }
  } catch {}
  // As a last resort, return 0 to indicate failure
  return 0;
}

// Session summary parser for get-session
export interface SessionSummary {
  exists: boolean;
  active?: boolean;
  expiresAt?: number;
  seq?: number;
  tutor?: string;
  badgeUri?: string;
}

export async function getSessionSummary(inst: number, code: string): Promise<SessionSummary> {
  const json = await fetchSession(inst, code);
  if (!json || json.type === 'none') return { exists: false };
  // json: { type: 'some', value: { type: 'tuple', value: { ... } } }
  const tuple = (json as any).value;
  if (!tuple || tuple.type !== 'tuple') return { exists: false };
  const v = tuple.value as Record<string, any>;
  const activeCv = v['active'];
  const expiresCv = v['expires-at'];
  const seqCv = v['seq'];
  const tutorCv = v['tutor'];
  const badgeCv = v['badge-uri'];
  return {
    exists: true,
    active: Boolean(activeCv?.value),
    expiresAt: typeof expiresCv?.value === 'number' ? Number(expiresCv.value) : undefined,
    seq: typeof seqCv?.value === 'number' ? Number(seqCv.value) : undefined,
    tutor: typeof tutorCv?.value === 'string' ? String(tutorCv.value) : undefined,
    badgeUri: typeof badgeCv?.value === 'string' ? String(badgeCv.value) : undefined,
  };
}
