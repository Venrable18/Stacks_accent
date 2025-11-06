# Stacks Accent — Attendance & Streak NFTs

A Stacks-based dApp for class attendance and streak rewards. Tutors create time-bound attendance sessions (with a session code and a metadata URI). Students claim attendance by submitting the code; each claim mints an attendance NFT. When a student reaches 15 consecutive classes within the same institution, they receive a one-time streak NFT.

## Highlights

- Institution-scoped sessions with canonical sequence numbers (one class per day).
- Per-session metadata URI (e.g., IPFS) attached to each attendance NFT.
- Consecutive streak logic: a gap resets the streak to 1.
- Automatic streak NFT award at 15 consecutive classes (one-time per student per institution).
- Fully tested Clarinet project with Vitest integration.

## Repository layout

- `Contract/`
  - `Clarinet.toml` — Clarinet project manifest.
  - `contracts/Attendance.clar` — Core Clarity smart contract.
  - `tests/Attendance.test.ts` — End-to-end unit tests (Vitest + clarinet simnet).
  - `package.json` — Test tooling dependencies.
  - `vitest.config.js` — Vitest configured to use the Clarinet environment.
- `FrontEnd/ReadMe.md` — Notes for integrating the frontend with the contract.
- `ArchME.MD`, `BuildME.MD`, `ContractM.MD`, `EventsME.Md` — Project notes and design docs.

## Contract overview

Contract: `Attendance`

- Tokens
  - `attendance-nft` — minted per successful claim.
  - `streak-nft` — minted once on the 15th consecutive class per student per institution.
- Constants
  - `STREAK-THRESHOLD` = `u15`
  - `STREAK-META-URI` — Fixed metadata URI for the streak NFT (configured in the contract).
- Key data maps
  - `class-sessions { inst, code } → { tutor, topic, date, badge-uri, expires-at, active, seq }`
  - `session-by-seq { inst, seq } → code`
  - `attendance-claims { student, code } → bool` (prevent duplicate claims)
  - `student-streaks { student, inst } → uint`
  - `last-seq-claimed { student, inst } → uint`
  - `streak-nft-awarded { student, inst } → bool`

### Public functions

- `create-session(inst, code, seq, topic, date, badge-uri, expires-at, active, tutor) -> (response bool uint)`
  - Creates a session for an institution with a canonical `seq`.
  - Errors:
    - `ERR-SESSION-EXISTS` if `{inst, code}` already exists.
    - `ERR-SEQ-TAKEN` if `{inst, seq}` already mapped.
- `claim-attendance(inst, code) -> (response { attendance-id, new-streak, streak-awarded } uint)`
  - Validates session active, prevents duplicates, mints attendance NFT, updates streak, and conditionally mints streak NFT.
  - Errors:
    - `ERR-NO-SESSION`, `ERR-INACTIVE`, `ERR-DUP-CLAIM`, `ERR-MINT-FAILED`.

### Read-only helpers

- `get-session(inst, code) -> (optional { ... })`
- `get-streak(student, inst) -> uint`
- `get-last-seq(student, inst) -> uint`
- `get-attendance-token-uri(token-id) -> (optional string-ascii)`
- `get-streak-token-uri(token-id) -> (optional string-ascii)` (fixed URI; same for all streak token-ids)

## Streak logic in brief

- Each institution maintains a canonical sequence (`seq`) for classes.
- A student’s streak increments only when claiming `seq = last-seq + 1` within the same institution.
- Any gap resets the streak to 1.
- On reaching 15, the contract mints a `streak-nft` once per `{student, institution}` and records it.

## Session expiry

- Each session stores `expires-at` (block height). Clients typically compute this (e.g., current height + 1) and pass it on session creation.
- An in-contract expiry assertion is commented to keep tests portable across environments; you can re-enable it if your environment exposes `block-height` consistently.

## Getting started

Prerequisites:
- Node.js and npm
- Clarinet CLI

Install and test (from `Contract/`):

```sh
npm install
clarinet check
npm test
```

- `clarinet check` compiles the contract.
- `npm test` runs the Vitest suite under the Clarinet simnet environment.

## Frontend integration

- Use `create-session` to publish a session with a `badge-uri` (IPFS metadata JSON).
- Students call `claim-attendance(inst, code)` to mint attendance NFTs.
- Attendance NFTs’ metadata can be read via `get-attendance-token-uri(token-id)`. The `badge-uri` set on the session is recorded against the minted token-id.
- Streak NFTs share a single metadata URI exposed by `get-streak-token-uri` and configured via `STREAK-META-URI` in the contract.

## Notes

- Error codes
  - `ERR-NO-SESSION u100`, `ERR-DUP-CLAIM u101`, `ERR-INACTIVE u102`, `ERR-EXPIRED u103`, `ERR-SEQ-TAKEN u104`, `ERR-SESSION-EXISTS u105`, `ERR-MINT-FAILED u106`.
- The contract currently does not restrict transfers (i.e., NFTs aren’t enforced as soulbound). You can add transfer guards via traits in a future iteration if needed.
- Authorization for tutors/institutions is out of scope for this MVP; add an allowlist or registry if desired.

## Roadmap

- Optional: Re-enable `block-height` expiry assertion when appropriate.
- SIP-009 compatibility and wallet metadata discovery.
- Tutor/institution allowlist and admin controls.
- More tests: streak reset on gaps, post-award behavior across multiple institutions.

