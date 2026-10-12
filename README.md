# CommitmentLedger dApp (Workbench & Ledger Interface)

Web workbench and ledger interface for the [CommitmentLedger Intelligent Contract](https://github.com/huzyow155/commitment-ledger-genlayer) on GenLayer Studionet (Preview).

[![Production Deployment](https://img.shields.io/badge/Vercel-Production-22c55e.svg)](https://commitment-ledger-app-genlayer.vercel.app)
[![Contract](https://img.shields.io/badge/Contract-0x3155...cb08-blue.svg)](https://explorer-studio.genlayer.com/address/0x3155c7c80f4334968d61E1b79f74EB864CF7cb08)
[![Network](https://img.shields.io/badge/Network-Studionet%20(Preview)-amber.svg)](https://explorer-studio.genlayer.com)

**Production URL**: [https://commitment-ledger-app-genlayer.vercel.app](https://commitment-ledger-app-genlayer.vercel.app)

---

## What It Is

`CommitmentLedger` is an Intelligent Contract deployed on GenLayer Studionet (Preview) that records public promises and settles them against allowlisted public sources (Wikipedia, Reuters, AP, BBC, NASA, NOAA, ECB) via multi-validator consensus.

The contract holds no funds, requires no collateral or tokens, and accepts no caller-written evidence text. All resolutions are source-grounded: validators fetch the referenced web page, verify that it pertains to the subject, extract a verbatim quote (12+ characters), and classify the outcome (`KEPT`, `BROKEN`, `PARTIAL`).

This repository contains the front-end dApp:
1. **Interactive Notary Ledger (`/`)**: A 13-section educational landing page designed with warm editorial craftsmanship, detailing the two-phase consensus lifecycle, allowlist rules, and on-chain evidence cases.
2. **Interactive Workbench (`/app`)**: An operational workbench providing:
   - In-browser throwaway wallet generation (zero setup, zero faucet dependency).
   - Real-time client-side input validation mirroring contract constraints.
   - **Snapshot-diff ID discovery**: Automatically finds new commitment IDs even if transaction receipts do not return method return values.
   - **Multi-stage consensus pipeline monitor**: Tracks broadcast, validator execution, receipt status, and decodes contract revert payloads.
   - **On-chain reference examples**: Interactive lookup cards pre-loaded with verified Studionet transactions.

---

## Application Screenshots

Captured directly from the Vercel production deployment ([https://commitment-ledger-app-genlayer.vercel.app](https://commitment-ledger-app-genlayer.vercel.app)):

| Landing Overview | How Consensus Works | Verified Studionet Evidence |
| :---: | :---: | :---: |
| ![Landing Top](docs/screens/landing_top.png) | ![How It Works](docs/screens/how_it_works.png) | ![Evidence](docs/screens/evidence.png) |

| Register Form & Client Validation | Reference Examples Inspector | Mobile Viewport (390px) |
| :---: | :---: | :---: |
| ![App Register](docs/screens/app_register.png) | ![App Examples](docs/screens/app_examples.png) | ![Mobile App](docs/screens/mobile_app.png) |

---

## Verified On-Chain Evidence

The dApp connects directly to contract `0x3155c7c80f4334968d61E1b79f74EB864CF7cb08`. The following cases were executed and accepted on GenLayer Studionet (Preview):

### Contract Verification Baseline (Cases A, B, C)

| Case | ID | Register Tx | Resolve Tx | Outcome | Source URL & Grounded Quote |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Case A** (Paraphrased Source, KEPT) | `1fe69a47c557` | [`0xd61b234967a1011ec915b56afeae573fb4bd54192f5ad1358fd82a90d1737abd`](https://explorer-studio.genlayer.com/tx/0xd61b234967a1011ec915b56afeae573fb4bd54192f5ad1358fd82a90d1737abd) | [`0x54b64f75cd22ef47ac2adecc71ee1e37dd95869c75ea7a274a7c6424e8b715c5`](https://explorer-studio.genlayer.com/tx/0x54b64f75cd22ef47ac2adecc71ee1e37dd95869c75ea7a274a7c6424e8b715c5) | `KEPT` | `https://en.wikipedia.org/wiki/Apollo_11`<br>Quote: *"Apollo 11 (July 16–24, 1969) was the American spaceflight that first landed humans on the Moon"* |
| **Case B** (Grounded Quote, BROKEN) | `605aa94797d3` | [`0xae2cd4b15272a53eaf11d6d3fb9fc5200610ddf170c494672f81c42cd7333823`](https://explorer-studio.genlayer.com/tx/0xae2cd4b15272a53eaf11d6d3fb9fc5200610ddf170c494672f81c42cd7333823) | [`0xf04a899cfb85a62e958a7e378b063026f21811726c8f8a612c7fbf080a85e943`](https://explorer-studio.genlayer.com/tx/0xf04a899cfb85a62e958a7e378b063026f21811726c8f8a612c7fbf080a85e943) | `BROKEN` | `https://en.wikipedia.org/wiki/Apollo_13`<br>Quote: *"the landing was aborted after an oxygen tank in the service module (SM) exploded two days into the mission"* |
| **Case C** (Distractor Rejection, NOMATCH) | `4efe7cbd0772` | [`0x588c25fb25bbb86c235943ae06a9dcfd7523238e1d177be731bad1244c7baec2`](https://explorer-studio.genlayer.com/tx/0x588c25fb25bbb86c235943ae06a9dcfd7523238e1d177be731bad1244c7baec2) | [`0x7dda2fcd83a02ce8d34fc451d3ff5bff18129ea078cc4a1d31776e1f73b74a59`](https://explorer-studio.genlayer.com/tx/0x7dda2fcd83a02ce8d34fc451d3ff5bff18129ea078cc4a1d31776e1f73b74a59) | Reverted (`OPEN`) | `https://en.wikipedia.org/wiki/Falcon_9`<br>Revert: `"source does not match this commitment"` |

### dApp End-to-End On-Chain Test Flow

Conducted on Studionet with throwaway key `0xCE99a5b07325130bea57D893d13eB8A882fBe7ff` via `scripts/run_e2e.mjs`:

- **Fresh Registered Commitment ID**: `2cb7fcbc7999`
- **Registration Transaction Hash**: [`0x0019c0d7d4df260e52cb6525e068e8eddfa47fa52361e63836e15641b7afb4c6`](https://explorer-studio.genlayer.com/tx/0x0019c0d7d4df260e52cb6525e068e8eddfa47fa52361e63836e15641b7afb4c6)
  - Registered Raw Text: `"The Apollo 11 lunar module will touch down on the lunar surface before 1970."`
  - Deadline Hint: `1970-01-01`
  - On-Chain Canonical Extraction Read-Back:
    - `subject`: `"apollo 11 lunar module"`
    - `action`: `"touch down on the lunar surface before 1970"`
    - `status`: `"OPEN"`
- **Resolution Transaction Hash**: [`0x30e08628b0d0441915b65df5dcfa9417021db95b4b7dfcb6ba3c66c8ec0c2854`](https://explorer-studio.genlayer.com/tx/0x30e08628b0d0441915b65df5dcfa9417021db95b4b7dfcb6ba3c66c8ec0c2854)
  - Source URL: `https://en.wikipedia.org/wiki/Apollo_11`
  - Consensus Status: `ACCEPTED`, Leader Result: `SUCCESS`
  - *Consensus Note*: Accepted after 2 retries following transient validator disagreement on Studionet.
  - Final Record Read-Back:
    - `status`: `"RESOLVED"`
    - `outcome`: `"KEPT"`
    - `resolution_quote`: `"Armstrong and Aldrin descended to the surface aboard the LM Eagle, landing in the Sea of Tranquility (Mare Tranquillitatis) on July 20 at 20:17 UTC"` (145 chars, verbatim substring verified)
    - `match_confirmed`: `true`

### dApp Negative Rejection Tests (On-Chain)

1. **Non-Allowlisted Domain Rejection**:
   - URL: `https://github.com/nasa/webb` on commitment `4efe7cbd0772`
   - Transaction Hash: [`0x0b377fbaf1221fb74004b7d35abb1004043e99f218a485a77363c1cdb3fcaefb`](https://explorer-studio.genlayer.com/tx/0x0b377fbaf1221fb74004b7d35abb1004043e99f218a485a77363c1cdb3fcaefb)
   - Leader Result: `ERROR`
   - Decoded Revert Payload: `"source_url domain not in authorized allowlist"`
2. **Double Resolution Guard**:
   - Attempted second resolution on resolved record `2cb7fcbc7999`
   - Transaction Hash: [`0x71df5d4f1571e57c06bc7e1cfdc897beabe73e881fb7d56fdbe06cc0f6a7576c`](https://explorer-studio.genlayer.com/tx/0x71df5d4f1571e57c06bc7e1cfdc897beabe73e881fb7d56fdbe06cc0f6a7576c)
   - Leader Result: `ERROR`
   - Decoded Revert Payload: `"commitment already resolved"`

Full structured JSON execution trace is preserved in [docs/E2E_EVIDENCE.json](docs/E2E_EVIDENCE.json).

---

## Honest Scope & Limitations

1. **Studionet (Preview) Environment**:
   - The contract and dApp operate on GenLayer Studionet (Chain ID 61999). Validator execution times can range from 15 to 45 seconds per write transaction.
2. **Source-Grounded Verdict, Not Absolute Truth**:
   - The contract does not claim to be an infallible oracle of world events. It strictly assesses whether the provided public source URL supports the claim and contains a verbatim grounding quote.
3. **6,000-Character Source Boundary**:
   - When resolving, validators inspect only the first 6,000 characters of the fetched web page. Citations or details located further down the page will not be read by validators.
4. **On-Chain vs Unit-Tested Branches**:
   - **On-Chain Verified**: Registration validation, canonical extraction (`{subject, action}`), `KEPT` resolution, `BROKEN` resolution, distractor rejection (`NOMATCH`), non-allowlist URL rejection, and double-resolution rejection.
   - **Unit-Tested Only**: The `PARTIAL` outcome, ungrounded quote rejection (`"no grounded quote in source"`), and unparseable model output (`"model returned no valid outcome"`) are validated via comprehensive unit tests in the contract repository (`tests/test_c1_edge_cases.py` and `tests/test_layer2_mocked.py`). On Studionet, ambiguous prompt resolutions can result in validator disagreement (`UNDETERMINED` / `MAJORITY_DISAGREE`), preserving the commitment in its `OPEN` state.

---

## System Architecture

```
+---------------------------------------------------------------------------------------+
|                                COMMITMENTLEDGER DAPP                                  |
+---------------------------------------------------------------------------------------+
|  User Browser (/app Workbench)                                                        |
|    │                                                                                  |
|    ├── Client-Side Preflight Checks (src/lib/validators.ts)                            |
|    │     ├── Character bounds (1 <= raw_text <= 400)                                  |
|    │     ├── Strict YYYY-MM-DD calendar date with leap year verification              |
|    │     └── Allowlist URL parsing (https only, no userinfo, port 443, 7 domains)     |
|    │                                                                                  |
|    ├── Throwaway Wallet (src/context/WalletContext.tsx)                               |
|    │     └── Ephemeral privateKey in sessionStorage, zero faucet funds required       |
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
|  Intelligent Contract: 0x3155c7c80f4334968d61E1b79f74EB864CF7cb08 (v2.2.0)            |
|    │                                                                                  |
|    ├── register_commitment(raw_text, deadline_hint)                                   |
|    │     └── Consensus extract {subject, action} via strict_eq -> Stores as OPEN      |
|    │                                                                                  |
|    └── submit_resolution(commitment_id, source_url)                                   |
|          ├── Clock Guard: gl.message_raw["datetime"] >= deadline_hint                  |
|          ├── Allowlist Guard: urllib.parse.urlsplit domain verification               |
|          ├── Web Render: gl.nondet.web.render(source_url)[:6000]                      |
|          └── Consensus Verification Cascade:                                          |
|                NOMATCH     -> Revert "source does not match this commitment"          |
|                INVALID     -> Revert "model returned no valid outcome"                |
|                UNGROUNDED  -> Revert "no grounded quote in source"                    |
|                MATCH       -> Transitions to RESOLVED with verbatim quote             |
+---------------------------------------------------------------------------------------+
```

---

## Repository Structure

```
commitment-ledger-app-genlayer/
├── contracts-reference/
│   └── CommitmentLedger.py       # Byte-identical reference copy of deployed contract
├── docs/
│   ├── ARCHITECTURE.md           # Consensus integration & frontend architecture
│   ├── TESTING.md                # Comprehensive test plan & audit checklist
│   ├── E2E_EVIDENCE.json         # Raw on-chain execution trace on Studionet
│   └── screens/                  # Production screenshots from Vercel deployment
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
│   │   ├── revertMap.ts          # Human-friendly decoding for 23 contract reverts
│   │   └── validators.ts         # Client-side input validation logic
│   ├── services/
│   │   └── contractService.ts    # JSON-RPC reads, transactions, snapshot-diff
│   ├── components/
│   │   ├── CommitmentCard.tsx    # Stamp-inspired commitment details card
│   │   ├── Header.tsx            # Navigation, network status, wallet actions
│   │   └── TxPipelineModal.tsx   # Multi-stage transaction pipeline tracker
│   ├── pages/
│   │   ├── Landing.tsx           # 13-section educational landing page
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

- **Expected SHA-256**: `fe63f0cc5a5788e2e3199919ddb5ee067c4c19c17389a8a250764f8e5299016f`
- **Verification Command**:
  ```bash
  node -e "const crypto = require('crypto'), fs = require('fs'); const hash = crypto.createHash('sha256').update(fs.readFileSync('contracts-reference/CommitmentLedger.py')).digest('hex'); console.log('SHA-256:', hash); process.exit(hash === 'fe63f0cc5a5788e2e3199919ddb5ee067c4c19c17389a8a250764f8e5299016f' ? 0 : 1);"
  ```

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
  - Contains the Python Intelligent Contract source, deploy scripts, unit tests, and the historical superseded deployments table (v1.0.0, v2.0.0, v2.1.0).
- **GenLayer Studionet Explorer**: [https://explorer-studio.genlayer.com](https://explorer-studio.genlayer.com)
