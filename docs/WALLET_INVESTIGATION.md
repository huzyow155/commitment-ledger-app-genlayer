# GenLayer Studionet Wallet Architecture & EIP-1193 Investigation

**Author**: CommitmentLedger Engineering Team  
**Date**: October 2026  
**Target Environment**: GenLayer Studionet (Preview) (Chain ID `61999` / `0xf22f`)  
**Status**: Architecture Decision Record & Feasibility Report  

---

## 1. Executive Summary

This document explains the technical reasons why the `CommitmentLedger` dApp uses browser-generated throwaway private keys stored in `localStorage` on GenLayer Studionet (Preview), rather than requiring an injected browser wallet (such as MetaMask or Rabby). It provides a technical analysis of current EIP-1193 compatibility constraints on Studionet and details the roadmap requirements for integrating third-party EVM wallets in future network phases.

---

## 2. Current Architecture: Browser-Side Ephemeral Keys

### 2.1 How It Works
- The dApp generates a random `secp256k1` private key on first load using Viem's `generatePrivateKey()`.
- The private key is retained exclusively in the browser's `localStorage` (`commitment_ledger_privkey_v1`).
- Write calls sign transactions locally using `@genlayer/js` (or Viem account primitives) and dispatch them directly to the Studionet JSON-RPC endpoint (`https://studio.genlayer.com/api`).
- No faucet drip, token balance, or external wallet extension is required for users to interact with the workbench.

### 2.2 Security & Honesty Safeguards
1. **Explicit Header Warning**: The header wallet button explicitly declares:
   > *"Studionet-only throwaway key. Preview network, no real value."*
2. **Storage Scope**: The wallet menu clearly alerts users that the key is stored in browser `localStorage` and warns against importing private keys holding assets with real value.
3. **Identity Honesty**: Because accounts on preview environments are ephemeral and unlinked to ENS or verifiable credentials, the UI labels all registrant and resolver addresses as:
   > `wallet address (identity not verified)`
4. **Key Portability**: Users can export their ephemeral private key or import a test key if they wish to retain continuity across browser sessions.

---

## 3. Why Injected EIP-1193 Wallets Are Not Used on Studionet Today

During the v2.2 and v3.1 development cycles, direct integration with injected EIP-1193 providers (`window.ethereum`) was evaluated. Four technical friction points prevent native MetaMask/Rabby usage without custom client shims:

### 3.1 Custom Chain Configuration & Network Switching
- GenLayer Studionet operates under Chain ID `61999` (`0xf22f`).
- While `wallet_addEthereumChain` can prompt MetaMask to add a custom RPC endpoint, Studionet is not part of default EVM lists (Chainlist).
- In multi-chain extensions, users frequently encounter network switching conflicts or RPC timeout alerts due to consensus polling intervals.

### 3.2 GenVM Binary Calldata vs Standard EVM ABIv2
- Standard EVM contracts expect calldata formatted per the Ethereum Contract ABI specification (a 4-byte keccak selector followed by 32-byte encoded arguments).
- GenLayer Intelligent Contracts run in **GenVM** (a Python execution environment). Function dispatch and arguments are serialized via GenLayer-specific binary encoding rather than EVM ABIv2.
- When an EIP-1193 provider attempts to simulate, inspect, or display calldata for `register_commitment` or `submit_resolution`, the wallet displays hex payloads that trigger "unrecognized contract method" warnings or fail client-side schema checks.

### 3.3 Zero-Gas Transactions & `eth_estimateGas` Behavior
- On GenLayer Studionet (Preview), transactions operate without gas fees (gas price is zero or handled out-of-band by validators).
- Standard wallets perform an automated `eth_estimateGas` simulation prior to prompting the user for signature approval.
- Studionet JSON-RPC handles `eth_estimateGas` differently from standard EVM execution clients (Geth, Nethermind). Wallets attempting to derive gas limits either fail during estimation or enforce a minimum non-zero gas price, preventing transaction submission.

### 3.4 Consensus Latency vs Block Inclusion
- On standard EVM rollups or L1s, wallet interfaces expect block inclusion within 1 to 12 seconds.
- On GenLayer, write calls trigger multi-node LLM evaluation and consensus (`prompt_comparative`). Processing takes between 15 and 45 seconds per write transaction.
- Standard injected wallet popups do not accommodate non-deterministic execution windows and frequently time out before the transaction receipt transitions to an accepted status.

---

## 4. Requirements for Future MetaMask / Rabby Integration

For third-party browser wallets to provide a seamless user experience on GenLayer, the following infrastructure developments are required:

1. **MetaMask Snap or Provider Translation Layer**:
   - A dedicated GenLayer MetaMask Snap capable of encoding GenVM calldata and decoding return values directly within the wallet confirmation dialog.
2. **RPC Gas Emulation**:
   - The Studionet JSON-RPC proxy must provide standard responses for `eth_estimateGas` and `eth_gasPrice` (returning safe defaults that allow zero-fee transactions to proceed without wallet rejections).
3. **Consensus Pipeline Status Awareness**:
   - Wallets must support extended receipt polling so that users are not told a transaction has failed while validators are still executing web fetches and non-deterministic consensus.
4. **Verified Identity Standard**:
   - For future production deployments, an identity verification standard (such as ERC-725, EAS attestations, or Gitcoin Passport) will be needed to transition from "unverified wallet addresses" to verified claimant identities.

---

## 5. Summary

Using client-side ephemeral keys in `localStorage` is currently the most reliable, secure, and friction-free approach for GenLayer Studionet (Preview). It allows immediate user exploration with zero setup while maintaining complete transparency regarding the preview status of the network and the unverified nature of signer addresses.
