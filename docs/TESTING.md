# Testing & Verification Report: CommitmentLedger dApp

This document details the multi-layered testing strategy, executed test suites, and empirical evidence for the `CommitmentLedger` application.

## 1. Unit Test Suite (Vitest)

Unit tests run in Node.js without browser dependencies (`npm test`):

- **Date & Calendar Validation**:
  - Valid ISO calendar dates (e.g. `1970-01-01`, `2026-10-12`).
  - Leap year acceptance (`2024-02-29`).
  - Leap year rejection on non-leap years (`2025-02-29`).
  - Out-of-bounds months (e.g. month `13`).
  - Free-text deadline rejection (e.g. `"end of Q2"`).
- **Source URL Validation**:
  - Protocol checks (`https` accepted, `http` rejected).
  - Port checks (`443` or omitted accepted, `8443` rejected).
  - Credentials rejection (userinfo forbidden).
  - IP literals and punycode (`xn--`) rejection.
  - Subdomain allowance (e.g. `en.wikipedia.org`).
  - Phishing / typo-squatting rejection (e.g. `evilwikipedia.org` and `wikipedia.org.evil.com` strictly rejected).
- **Outcome & Status Parsing**:
  - Exact token matching for `OPEN` and `RESOLVED` (no substring or `includes`).
  - Exact token matching for `KEPT`, `BROKEN`, `PARTIAL` (unknown values map to `UNKNOWN`).
- **Revert Mapping**:
  - Every one of the 23 contract revert reasons has a dedicated user-friendly mapping.

**Results**: 26 / 26 passing (`tests/validators.test.ts`).

## 2. On-Chain End-to-End Suite (`scripts/run_e2e.mjs`)

Executed on GenLayer Studionet (Preview) using an automated throwaway dev account (`0xCE99a5b07325130bea57D893d13eB8A882fBe7ff`):

1. **Commitment Registration**:
   - Statement: `"The Apollo 11 lunar module will touch down on the lunar surface before 1970. (E2E run 1791775386017)"`
   - Deadline: `"1970-01-01"`
   - Register Tx: `0x0019c0d7d4df260e52cb6525e068e8eddfa47fa52361e63836e15641b7afb4c6`
   - Discovered ID: `2cb7fcbc7999`
2. **Initial Read-Back**:
   - Status: `OPEN`
   - Canonical Subject: `"apollo 11 lunar module"`
   - Canonical Action: `"touch down on the lunar surface before 1970"`
3. **Resolution via Wikipedia**:
   - Source: `https://en.wikipedia.org/wiki/Apollo_11`
   - Resolve Tx: `0x30e08628b0d0441915b65df5dcfa9417021db95b4b7dfcb6ba3c66c8ec0c2854` (retried after initial validator disagreement; status `ACCEPTED`, leader result `SUCCESS`)
   - Read-back status: `RESOLVED`
   - Read-back outcome: `KEPT`
   - Grounded quote: `"Armstrong and Aldrin descended to the surface aboard the LM Eagle, landing in the Sea of Tranquility (Mare Tranquillitatis) on July 20 at 20:17 UTC"`
4. **On-Chain Negative Rejection Tests**:
   - Non-allowlisted domain (GitHub): Tx `0x0b377fbaf1221fb74004b7d35abb1004043e99f218a485a77363c1cdb3fcaefb` -> Leader Result `ERROR`, decoded revert `"source_url domain not in authorized allowlist"`.
   - Already resolved double submission: Tx `0x71df5d4f1571e57c06bc7e1cfdc897beabe73e881fb7d56fdbe06cc0f6a7576c` -> Leader Result `ERROR`, decoded revert `"commitment already resolved"`.

Full report saved in `docs/E2E_EVIDENCE.json`.

## 3. Playwright Production UI Tests (`tests/ui_production.mjs`)

Executed against the production Vercel deployment (`https://commitment-ledger-app-genlayer.vercel.app`):

1. **Desktop Viewport (1280px)**:
   - Verified 39 headings across all 13 landing sections.
   - Verified zero horizontal scroll.
   - Captured screenshots: `landing_top.png`, `how_it_works.png`, `evidence.png`.
2. **Reduced Motion Mode**:
   - Confirmed all typography and sections remain visible when `prefers-reduced-motion: reduce` is enabled.
3. **Mobile Viewport (390px)**:
   - Verified responsive single-column layout with zero horizontal overflow.
   - Captured screenshot: `mobile_app.png`.
4. **Workbench Form Validations (/app)**:
   - Generated throwaway dev account chip verified.
   - Register form blocks non-leap date `2025-02-29` and 401 characters.
   - Resolve form blocks `http://`, `https://github.com/...`, and `https://evilwikipedia.org/`.
   - Captured screenshots: `app_register.png`, `app_examples.png`.
5. **Reference Examples Loading**:
   - Loaded Case A (`1fe69a47c557`, KEPT), Case B (`605aa94797d3`, BROKEN), and Case C (`4efe7cbd0772`, OPEN distractor rejection) directly from GenLayer Studionet RPC.

All automated UI tests passed in 13.25 seconds.
