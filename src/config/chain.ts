import { studionet } from "genlayer-js/chains";

export const NETWORK_NAME = "GenLayer Studionet";
export const NETWORK_STATUS = "Studionet (Preview)";
export const CHAIN_ID = 61999;
export const RPC_URL = "https://studio.genlayer.com/api";
export const EXPLORER_BASE = "https://explorer-studio.genlayer.com";

// Single canonical place for the contract address
export const CONTRACT_ADDRESS = "0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB" as const;
export const CONTRACT_SCHEMA_VERSION = "3.1.0";
export const CONTRACT_DEPLOY_TX = "0x6654b4245ee74f4f1339ef13cdff1cf9654cb83714ed9e9810b81ba313f868d6";
export const CONTRACT_SOURCE_SHA256 = "9380175f322387696259a522483239be209d58b8e21fd4928cadf4ab46702e0e";

export const GENLAYER_CHAIN = studionet;

export const CONTRACT_REPO_URL = "https://github.com/huzyow155/commitment-ledger-genlayer";
export const APP_REPO_URL = "https://github.com/huzyow155/commitment-ledger-app-genlayer";

export const ALLOWED_DOMAINS = [
  "wikipedia.org",
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "nasa.gov",
  "noaa.gov",
  "ecb.europa.eu",
] as const;

export const CLAIM_KINDS = ["SELF_DECLARED", "THIRD_PARTY_REPORT"] as const;
export type ClaimKind = (typeof CLAIM_KINDS)[number];

export const CHALLENGE_REASONS = [
  "UNSUPPORTED_CLASSIFICATION",
  "CONFLICTING_EVIDENCE",
] as const;
export type ChallengeReason = (typeof CHALLENGE_REASONS)[number];

export const MAX_RAW_TEXT_LENGTH = 400;
export const MAX_SOURCE_URL_LENGTH = 300;
export const CHALLENGE_WINDOW_SECONDS = 600;
export const MAX_DECISIONS = 3;


export const getExplorerAddressUrl = (address: string) =>
  `${EXPLORER_BASE}/address/${address}`;

export const getExplorerTxUrl = (txHash: string) =>
  `${EXPLORER_BASE}/tx/${txHash}`;
