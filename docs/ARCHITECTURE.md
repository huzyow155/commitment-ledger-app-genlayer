# Architecture & Consensus Integration: CommitmentLedger dApp

This document details the system design, consensus mechanics, and frontend architecture of the `CommitmentLedger` application on GenLayer Studionet (Preview).

## 1. Overview & Trust Model

CommitmentLedger is a public promise notary operating on GenLayer Studionet (Preview).
The smart contract (`CommitmentLedger.py`, Schema 2.2.0) holds no funds, requires no collateral or tokens, and does not accept caller-authored evidence.

### Core Premise: Source-Grounded Verdict
The application is not an oracle of absolute real-world truth. Rather:
- Commitments are registered with mandatory calendar date deadlines.
- When the deadline passes on the chain message clock, callers provide an allowlisted public reference URL (Wikipedia, Reuters, AP, BBC, NASA, NOAA, ECB).
- GenLayer validators fetch the first 6,000 characters of the cited web page directly via `gl.nondet.web.render`.
- Multi-validator consensus classifies the outcome (`KEPT`, `BROKEN`, `PARTIAL`) and enforces a verbatim quote (`>= 12` characters) present in the fetched text.

```
+-------------------------------------------------------------------------+
|                         TWO-PHASE CONSENSUS                             |
+-------------------------------------------------------------------------+
| Phase 1: Registration                                                   |
|   Caller -> register_commitment(raw_text, deadline_hint)                |
|          -> Strict YYYY-MM-DD validation                                |
|          -> Validators extract canonical {subject, action} via strict_eq|
|          -> Nonce assigned & commitment sealed as OPEN                  |
|                                                                         |
| Phase 2: Resolution (post-deadline)                                     |
|   Caller -> submit_resolution(commitment_id, source_url)                |
|          -> Check clock: current_date >= deadline_hint                  |
|          -> Allowlist check: 7 trusted reference domains                 |
|          -> Validators fetch page & truncate to 6,000 chars             |
|          -> Resolution Cascade:                                         |
|               1. NOMATCH: distractor -> revert, stays OPEN              |
|               2. INVALID: unparsed outcome -> revert, stays OPEN        |
|               3. UNGROUNDED: missing/short quote -> revert, stays OPEN  |
|               4. MATCH: accepted -> sealed as RESOLVED (permanent)      |
+-------------------------------------------------------------------------+
```

## 2. Frontend Components Architecture

```
src/
├── config/
│   └── chain.ts            # Canonical contract address, RPC, allowlist, and limits
├── lib/
│   ├── validators.ts       # Pure client-side mirrors of contract validations
│   ├── outcome.ts          # Exact-token parser for status and outcome
│   └── revertMap.ts        # 23 contract revert reasons mapped to human descriptions
├── services/
│   └── contractService.ts  # ContractReadResult, pollTransactionReceipt, snapshot-diff
├── context/
│   └── WalletContext.tsx   # Throwaway in-browser account generator (zero funds needed)
├── components/
│   ├── Header.tsx          # Network badge, contract address copy, wallet menu
│   ├── CommitmentCard.tsx  # Stamp-like chips, quotes, canonical extraction display
│   └── TxPipelineModal.tsx # Multi-stage transaction monitor with revert decoding
└── pages/
    ├── Landing.tsx         # 13-section explanatory overview with interactive demo
    └── Workbench.tsx       # Operational /app with Register, Resolve, Lookup, Examples
```

## 3. ID Discovery via Snapshot-Diff

Because GenLayer smart contract write transactions return transaction hashes rather than function return values to clients, the frontend implements the **Snapshot-Diff Discovery Pattern**:
1. Before sending `register_commitment`, the app queries `list_commitments_by_registrant(account.address, 25)` and records all existing IDs.
2. The write transaction is broadcast and polled until accepted by validators with `SUCCESS`.
3. The app queries `list_commitments_by_registrant` again and identifies the newly created ID matching the submitted statement.
4. The newly registered commitment card is displayed immediately with its extracted canonical `{subject, action}` fields.

## 4. Error & Revert Handling

Transaction receipts from GenLayer RPC contain leader receipts with base64-encoded execution results. The frontend decodes `leader_receipt[0].result` (skipping the initial status prefix byte) and maps raw strings into user-friendly guidance:
- Distractor sources revert with `"source does not match this commitment"`, explicitly alerting the user that the commitment remains **OPEN**.
- Validator disagreement (status `UNDETERMINED` or `MAJORITY_DISAGREE`) displays a retry panel explaining that consensus was not achieved and the commitment state remains intact.
