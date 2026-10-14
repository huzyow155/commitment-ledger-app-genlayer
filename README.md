# CommitmentLedger dApp (Workbench & Ledger Interface)

Web workbench and ledger interface for the [CommitmentLedger Intelligent Contract](https://github.com/huzyow155/commitment-ledger-genlayer) on GenLayer Studionet (Preview).

[![Production Deployment](https://img.shields.io/badge/Vercel-Production-22c55e.svg)](https://commitment-ledger-app-genlayer.vercel.app)
[![Contract](https://img.shields.io/badge/Contract-0xdD0d...44E8-blue.svg)](https://explorer-studio.genlayer.com/address/0xdD0d120B50ED65400E8b6a060bB15103B42544E8)
[![Network](https://img.shields.io/badge/Network-Studionet%20(Preview)-amber.svg)](https://explorer-studio.genlayer.com)

**Production URL**: [https://commitment-ledger-app-genlayer.vercel.app](https://commitment-ledger-app-genlayer.vercel.app)

---

## What It Is

`CommitmentLedger` is an Intelligent Contract deployed on GenLayer Studionet (Preview) that records public promises and settles them against allowlisted public sources (Wikipedia, Reuters, AP, BBC, NASA, NOAA, ECB) via multi-validator consensus.

The contract holds no funds, requires no collateral or tokens, and accepts no caller-written evidence text. All resolutions are source-grounded: validators fetch the referenced web page, verify that it pertains to the subject, extract a verbatim quote (12+ characters), and classify the outcome (`KEPT`, `BROKEN`, `PARTIAL`).

This repository contains the front-end dApp:
1. **Interactive Notary Ledger (`/`)**: An educational landing page designed with warm editorial craftsmanship, detailing the two-phase consensus lifecycle, allowlist rules, and on-chain evidence cases.
2. **Interactive Workbench (`/app`)**: An operational workbench providing:
   - In-browser throwaway wallet generation (zero setup, zero faucet dependency).
   - Real-time client-side input validation mirroring contract constraints (including prospective vs retrospective deadline detection).
   - **Snapshot-diff ID discovery**: Automatically finds new commitment IDs even if transaction receipts do not return method return values.
   - **Multi-stage consensus pipeline monitor**: Tracks broadcast, validator execution, receipt status, and decodes contract revert payloads.
   - **On-chain reference examples**: Interactive lookup cards pre-loaded with verified Studionet transactions.
   - **Challenge & Dispute Modal**: Structured modal allowing participants to initiate bounded reconsideration re-reviews during the 120-second challenge window.

---

## Application Screenshots

Captured directly from the Vercel production deployment ([https://commitment-ledger-app-genlayer.vercel.app](https://commitment-ledger-app-genlayer.vercel.app)):

| Header & Brand Mark (Closed Menu) | Fullscreen Menu Drawer (Open) | Browser Tab & Vector Favicon |
| :---: | :---: | :---: |
| ![Header Closed](docs/screens/header_closed.png) | ![Menu Drawer Open](docs/screens/menu_drawer_open.png) | ![Browser Tab Favicon](docs/screens/browser_tab_favicon.png) |

| Hero Serif Intro (Mid-Reveal) | Landing Overview (Settled) | Editorial Section (Architecture) |
| :---: | :---: | :---: |
| ![Landing Hero Mid-Reveal](docs/screens/landing_hero_mid_reveal.png) | ![Landing Top](docs/screens/landing_top.png) | ![Editorial Section](docs/screens/editorial_section.png) |

| Ocean Section (How Consensus Works) | Ocean Section (Verified Studionet Evidence) | Register Form & Client Validation |
| :---: | :---: | :---: |
| ![How It Works](docs/screens/how_it_works.png) | ![Evidence](docs/screens/evidence.png) | ![App Register](docs/screens/app_register.png) |

| Reference Examples Inspector | Mobile Landing (390px) | Mobile Workbench (390px) |
| :---: | :---: | :---: |
| ![App Examples](docs/screens/app_examples.png) | ![Mobile Landing](docs/screens/mobile_landing.png) | ![Mobile App](docs/screens/mobile_app.png) |

**Standalone Project Logo (for Portal submission)**: [`docs/logo/commitmentledger-logo.png`](docs/logo/commitmentledger-logo.png) (`1024x1024` transparent PNG) and [`public/logo.svg`](public/logo.svg) / [`public/logo-wordmark.svg`](public/logo-wordmark.svg).

---

## Verified On-Chain Evidence

The dApp connects directly to contract `0xdD0d120B50ED65400E8b6a060bB15103B42544E8`. The following cases were executed and accepted by validators on GenLayer Studionet (Preview):

### Contract Verification Baseline

| Case | ID | Register Tx | Resolve Tx | Outcome | Source URL & Grounded Quote |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Case P1** (Prospective, OPEN) | `3d2cc5901dad` | [`0x30883fec9e9135929dccc73857b461358606c74c6870ebc274562379c5c6382c`](https://explorer-studio.genlayer.com/tx/0x30883fec9e9135929dccc73857b461358606c74c6870ebc274562379c5c6382c) | None (Pending Maturity) | `null` (status `OPEN`) | `https://en.wikipedia.org/wiki/List_of_spaceflight_launches_in_October%E2%80%93December_2026`<br>Forward-looking commitment maturing 2026-10-16. |
| **Case A** (Paraphrased Source, KEPT) | `d569fda4e876` | [`0x6899aa4400c42c606b80a570deceec0105179c83dd2e783eae11202ef81eab38`](https://explorer-studio.genlayer.com/tx/0x6899aa4400c42c606b80a570deceec0105179c83dd2e783eae11202ef81eab38) | [`0xd379123921e3f89d9e360ca8c7913d748c82f58f897cf08dd6b1490588eb449f`](https://explorer-studio.genlayer.com/tx/0xd379123921e3f89d9e360ca8c7913d748c82f58f897cf08dd6b1490588eb449f) | `KEPT` | `https://en.wikipedia.org/wiki/Apollo_11`<br>Elements e1, e2, e3 all `SATISFIED`. Evidence SHA-256 fingerprint verified. |
| **Case B** (Contradicted Action, BROKEN) | `9875a6cdef6d` | [`0xf2ce034fcf4b7b8598330d81944b7f315a18024cc44e64882b872096a1cdbf5a`](https://explorer-studio.genlayer.com/tx/0xf2ce034fcf4b7b8598330d81944b7f315a18024cc44e64882b872096a1cdbf5a) | [`0x0684f543bf5e95f6f1656150a03ca8fa2dbb7409d74e7bfbf3559347a973acbc`](https://explorer-studio.genlayer.com/tx/0x0684f543bf5e95f6f1656150a03ca8fa2dbb7409d74e7bfbf3559347a973acbc) | `BROKEN` | `https://en.wikipedia.org/wiki/Apollo_13`<br>Action e1 marked `NOT_SATISFIED` due to oxygen tank explosion and mission abort. |
| **Case C** (Condition Omitted, BROKEN) | `ec77538d32e9` | [`0x0b7176db894ee47fb8805667d4d1a38ddce4b3c4917f09a4c735b2e59eb524d2`](https://explorer-studio.genlayer.com/tx/0x0b7176db894ee47fb8805667d4d1a38ddce4b3c4917f09a4c735b2e59eb524d2) | [`0x724098f2fa4c497274c3c29ab60083eed8012adf7866a45b8af36356d72081b5`](https://explorer-studio.genlayer.com/tx/0x724098f2fa4c497274c3c29ab60083eed8012adf7866a45b8af36356d72081b5) | `BROKEN` | `https://en.wikipedia.org/wiki/Apollo_11`<br>Condition "all three astronauts" marked `NOT_SATISFIED` as Collins stayed in orbit. |
| **Case D** (Missed Deadline, OPEN) | `a0d3d1ba6356` | [`0x019162a6722dbfe94c96050be14ecd773fa8ca8026175f508f668416107e146b`](https://explorer-studio.genlayer.com/tx/0x019162a6722dbfe94c96050be14ecd773fa8ca8026175f508f668416107e146b) | [`0xbfd05f848dd5bf898b9089a877f37edbb4a179fbc971884c5e752f04bec9e177`](https://explorer-studio.genlayer.com/tx/0xbfd05f848dd5bf898b9089a877f37edbb4a179fbc971884c5e752f04bec9e177) | Reverted (`OPEN`) | `https://en.wikipedia.org/wiki/Apollo_11`<br>Reverted with inconclusive evidence, preserving commitment as `OPEN`. |

### On-Chain Negative Rejection Tests

| Test | Submitted Parameter | Transaction Hash | Status Name | Leader Result | Revert Payload |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Retrospective Without Ack | `1969-07-20` without ack | [`0xa025fb40394d752a2bf3f79cf0e66d7755daecf8daf8f2b530f001964e41db72`](https://explorer-studio.genlayer.com/tx/0xa025fb40394d752a2bf3f79cf0e66d7755daecf8daf8f2b530f001964e41db72) | `ACCEPTED` | `ERROR` | `"deadline is not after registration date; set retrospective_ack to record a historical claim"` |
| Invalid Claim Kind | `"UNOFFICIAL"` | [`0xd565b19a8a3f2c453b146d7399741655cbe54be11cc5ccb8b248d9777f0b5bf4`](https://explorer-studio.genlayer.com/tx/0xd565b19a8a3f2c453b146d7399741655cbe54be11cc5ccb8b248d9777f0b5bf4) | `ACCEPTED` | `ERROR` | `"claim_kind must be SELF_DECLARED or THIRD_PARTY_REPORT"` |
| Premature Resolution | `2099-01-01` before deadline | [`0x4b210b3ab195d8765ece9e8b0ac0bd9f9ed7bc8fc3606bc7c5bc71ec6cd9171e`](https://explorer-studio.genlayer.com/tx/0x4b210b3ab195d8765ece9e8b0ac0bd9f9ed7bc8fc3606bc7c5bc71ec6cd9171e) | `ACCEPTED` | `ERROR` | `"cannot resolve before deadline date"` |
| Distractor Source Rejection | Falcon 9 article for Apollo | [`0x1d4132b76b6a33f156ea4f66efd32015ea04612cf754666c3b349d89d11e2011`](https://explorer-studio.genlayer.com/tx/0x1d4132b76b6a33f156ea4f66efd32015ea04612cf754666c3b349d89d11e2011) | `ACCEPTED` | `ERROR` | `"source does not match this commitment"` |
| Non-Allowlisted Domain | `https://github.com/nasa/webb` | [`0xe9a3457e57ff0da66c9fe7a0e569c489c05e6b00cda0bea8f2b98be45376f4a3`](https://explorer-studio.genlayer.com/tx/0xe9a3457e57ff0da66c9fe7a0e569c489c05e6b00cda0bea8f2b98be45376f4a3) | `ACCEPTED` | `ERROR` | `"source_url domain not in authorized allowlist"` |
| Challenge While Open | Challenge on unadjudicated claim | [`0xb56ab310f04b61d9d9b10ad5d8b1d51252880eb250dec912300af265f7e6d3e4`](https://explorer-studio.genlayer.com/tx/0xb56ab310f04b61d9d9b10ad5d8b1d51252880eb250dec912300af265f7e6d3e4) | `ACCEPTED` | `ERROR` | `"commitment is not in provisional status"` |
| Finalize While Open | Finalize on unadjudicated claim | [`0x73acc08da9391f0597ef8f27c8911bce5772bf713e141f0a88a45146a3bd8ced`](https://explorer-studio.genlayer.com/tx/0x73acc08da9391f0597ef8f27c8911bce5772bf713e141f0a88a45146a3bd8ced) | `ACCEPTED` | `ERROR` | `"commitment is not in provisional status"` |
| Early Finalize | Finalize before window expires | [`0xa74ba93acb13951a376e9ff7359b27b9f879800db7cceecdba63865836d83fcd`](https://explorer-studio.genlayer.com/tx/0xa74ba93acb13951a376e9ff7359b27b9f879800db7cceecdba63865836d83fcd) | `ACCEPTED` | `ERROR` | `"challenge window still open"` |

---

## Honest Scope & Limitations

1. **Studionet (Preview) Environment**:
   - The contract and dApp operate on GenLayer Studionet (Chain ID 61999). Validator execution times can range from 15 to 45 seconds per write transaction.
2. **Source-Grounded Verdict, Not Absolute Truth**:
   - The contract does not claim to be an infallible oracle of world events. It strictly assesses whether the provided public source URL supports the claim and contains verbatim grounding evidence.
3. **12,000-Character Source Window Boundary**:
   - When resolving, validators deterministically select keyword-relevant windows up to 12,000 characters from allowlisted web pages to remain within LLM context bounds and ensure deterministic consensus.
4. **On-Chain vs Unit-Tested Branches**:
   - **On-Chain Verified**: Prospective vs retrospective classification, claim kind declarations, element-based conjunction adjudication, distractor rejection, non-allowlist rejection, and the challenge & dispute state machine.
   - **Unit-Tested Only**: Boundary cases such as max decisions cap (3), malformed JSON parsing from adversarial models, and sentence segmentations are verified via Python unit tests in the contract repository.

---

## System Architecture

```text
+---------------------------------------------------------------------------------------+
|                                COMMITMENTLEDGER DAPP                                  |
+---------------------------------------------------------------------------------------+
|  User Browser (/app Workbench)                                                        |
|    │                                                                                  |
|    ├── Client-Side Preflight Checks (src/lib/validators.ts)                            |
|    │     ├── Character bounds (1 <= raw_text <= 400)                                  |
|    │     ├── Calendar date check & prospective vs retrospective deadline detection     |
|    │     └── Allowlist URL parsing (https only, no userinfo, port 443, 7 domains)     |
|    │                                                                                  |
|    ├── Throwaway Wallet (src/context/WalletContext.tsx)                               |
|    │     └── Ephemeral privateKey in localStorage, zero faucet funds required         |
|    │                                                                                  |
|    └── Transaction Pipeline Monitor (src/components/TxPipelineModal.tsx)              |
|          ├── Broadcast -> Poll transaction status via JSON-RPC                        |
|          ├── Leader Receipt Extraction -> Status code & decoded revert payload         |
|          └── Snapshot-Diff Discovery: Diff list_commitments_by_registrant before/after|
+---------------------------------------------------------------------------------------+
                                        │
                                        ▼ HTTPS JSON-RPC (https://studio.genlayer.com/api)
+---------------------------------------------------------------------------------------+
|                                GENLAYER STUDIONET                                     |
+---------------------------------------------------------------------------------------+
|  Intelligent Contract: 0xdD0d120B50ED65400E8b6a060bB15103B42544E8 (v3.0.0)            |
|    │                                                                                  |
|    ├── register_commitment(raw_text, deadline_hint, claim_kind, retrospective_ack)    |
|    │     └── Temporal check: PROSPECTIVE vs RETROSPECTIVE -> Stores as OPEN           |
|    │                                                                                  |
|    ├── submit_resolution(commitment_id, source_url)                                   |
|    │     ├── Window selection & segmentation -> sha256 evidence fingerprint          |
|    │     ├── Element-based evaluation -> Conjunction rule                             |
|    │     └── Sets status PROVISIONAL with 120s challenge window                       |
|    │                                                                                  |
|    ├── challenge_resolution(commitment_id, reason_code, rationale, countervailing_url)|
|    │     └── Reconsideration under strict grounding -> WITHDRAWN if ungrounded        |
|    │                                                                                  |
|    └── finalize_resolution(commitment_id)                                             |
|          └── Closes window -> Sets status "FINAL"                                     |
+---------------------------------------------------------------------------------------+
```

---

## Repository Structure

```text
commitment-ledger-app-genlayer/
├── contracts-reference/
│   └── CommitmentLedger.py       # Byte-identical reference copy of deployed contract
├── docs/
│   ├── ARCHITECTURE.md           # Consensus integration & frontend architecture
│   ├── TESTING.md                # Comprehensive test plan & audit checklist
│   ├── E2E_EVIDENCE.json         # Raw on-chain execution trace on Studionet
│   ├── logo/
│   │   └── commitmentledger-logo.png # Standalone 1024x1024 transparent PNG logo for Portal submission
│   └── screens/                  # Production screenshots from Vercel deployment
├── public/
│   ├── logo.svg                  # Master standalone vector mark
│   ├── logo-wordmark.svg         # Mark + CommitmentLedger v3.0 lockup
│   ├── favicon.svg               # Vector favicon
│   ├── favicon-32x32.png         # 32x32 PNG favicon
│   └── apple-touch-icon.png      # 180x180 Apple touch icon
├── scripts/
│   ├── check_address_consistency.mjs # Verifies contract address across codebase
│   ├── run_e2e.mjs               # On-chain test suite on GenLayer Studionet
│   ├── scan_ascii.mjs            # Pure ASCII code scanner
│   ├── scan_banned.mjs           # Zero-tolerance banned word auditor
│   ├── scan_secrets.mjs          # Secret & private key leak prevention scanner
│   └── verify_bundle.mjs         # Production dist/ bundle analyzer
├── src/
│   ├── config/chain.ts           # Chain constants, contract address, allowlist
│   ├── context/WalletContext.tsx # Throwaway wallet session management
│   ├── lib/
│   │   ├── outcome.ts            # Exact-token parser for status & outcome
│   │   ├── revertMap.ts          # Human-friendly decoding for contract reverts
│   │   └── validators.ts         # Client-side input validation logic
│   ├── services/
│   │   └── contractService.ts    # JSON-RPC reads, transactions, snapshot-diff
│   ├── components/
│   │   ├── CommitmentCard.tsx    # Stamp-inspired commitment details card
│   │   ├── Header.tsx            # Navigation, network status, wallet actions
│   │   └── TxPipelineModal.tsx   # Multi-stage transaction pipeline tracker
│   ├── pages/
│   │   ├── Landing.tsx           # Educational landing page
│   │   └── Workbench.tsx         # Operational /app workbench
│   ├── App.tsx                   # Hash-based view router
│   └── main.tsx                  # Application entry point
├── tests/
│   ├── ui_production.mjs         # Playwright production UI test suite
│   └── validators.test.ts        # Vitest client-side validation test suite
└── package.json
```

---

## Contract Reference Verification

The file `contracts-reference/CommitmentLedger.py` is byte-identical to the contract deployed on Studionet:

- **Expected SHA-256**: `e14342dac8a0bdb983d4796557a59d3ae0e47e0715b9290d46cf3986cae1ac9c`
- **Verification Command**:
  ```bash
  node -e "const crypto = require('crypto'), fs = require('fs'); const hash = crypto.createHash('sha256').update(fs.readFileSync('contracts-reference/CommitmentLedger.py')).digest('hex'); console.log('SHA-256:', hash); process.exit(hash === 'e14342dac8a0bdb983d4796557a59d3ae0e47e0715b9290d46cf3986cae1ac9c' ? 0 : 1);"
  ```

---

## Superseded Deployments

The following contracts were deployed during development and have been superseded:

| Address | Deploy Transaction Hash | Superseded Reason |
| :--- | :--- | :--- |
| `0x3155c7c80f4334968d61E1b79f74EB864CF7cb08` | [`0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a`](https://explorer-studio.genlayer.com/tx/0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a) | Superseded by v3.0.0: answered steward review with temporal authenticity, element-based adjudication of full original statement, claim kind/identity unverified, bounded challenge & reconsideration state machine, and sha256 evidence fingerprints. |
| `0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1` | [`0x9b738652bceac390143a01f7dcf7ca24b7a92714430d950c34f9ae2936de4f52`](https://explorer-studio.genlayer.com/tx/0x9b738652bceac390143a01f7dcf7ca24b7a92714430d950c34f9ae2936de4f52) | Superseded by v2.2.0: could write PARTIAL when model returned no valid outcome. |
| `0x8a5269aa724E77D799b3F0dbbaeee7683157f52d` | [`0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b`](https://explorer-studio.genlayer.com/tx/0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b) | Superseded by v2.1.0: removed ungrounded fallback and enforced mandatory calendar date deadlines. |
| `0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3` | [`0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235`](https://explorer-studio.genlayer.com/tx/0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235) | Initial caller-written text prototype, superseded by source-based resolution. |

---

## Local Development & Testing

### Prerequisites

- Node.js >= 18
- npm >= 9

### Getting Started

```bash
# Clone the repository
git clone https://github.com/huzyow155/commitment-ledger-app-genlayer.git
cd commitment-ledger-app-genlayer

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Running Test & Verification Suites

```bash
# Run unit tests (Vitest)
npm test

# Run full project checks (Unit tests + ASCII + Banned Words + Secrets + Address consistency)
npm run check

# Build production bundle and verify absence of superseded contract addresses
npm run build
node scripts/verify_bundle.mjs

# Run production UI tests against Vercel deployment (Playwright)
node tests/ui_production.mjs
```

---

## Related Repositories

- **Contract Repository**: [https://github.com/huzyow155/commitment-ledger-genlayer](https://github.com/huzyow155/commitment-ledger-genlayer)
  - Contains the Python Intelligent Contract source, deploy scripts, unit tests, and the historical superseded deployments table (v1.0.0, v2.0.0, v2.1.0, v2.2.0).
- **GenLayer Studionet Explorer**: [https://explorer-studio.genlayer.com](https://explorer-studio.genlayer.com)
