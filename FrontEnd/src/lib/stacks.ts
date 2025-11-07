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
  // optional principal comes back as { type: 'some'|'none', value: 'SP...' }
  if (json.type === 'some') {
    return json.value as string;
  }
  return null;
}
