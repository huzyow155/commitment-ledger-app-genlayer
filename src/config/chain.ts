import { studionet } from "genlayer-js/chains";

export const NETWORK_NAME = "GenLayer Studionet";
export const NETWORK_STATUS = "Studionet (Preview)";
export const CHAIN_ID = 61999;
export const RPC_URL = "https://studio.genlayer.com/api";
export const EXPLORER_BASE = "https://explorer-studio.genlayer.com";

// Single canonical place for the contract address
export const CONTRACT_ADDRESS = "0xdD0d120B50ED65400E8b6a060bB15103B42544E8" as const;
export const CONTRACT_SCHEMA_VERSION = "3.0.0";
export const CONTRACT_DEPLOY_TX = "0x9ddb3a96c40d222c8e4ac1b781029a3b6c33937796aa1348a060f4ea9ba14467";
export const CONTRACT_SOURCE_SHA256 = "e14342dac8a0bdb983d4796557a59d3ae0e47e0715b9290d46cf3986cae1ac9c";

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
export const CHALLENGE_WINDOW_SECONDS = 86400;
export const MAX_DECISIONS = 3;


export const getExplorerAddressUrl = (address: string) =>
  `${EXPLORER_BASE}/address/${address}`;

export const getExplorerTxUrl = (txHash: string) =>
  `${EXPLORER_BASE}/tx/${txHash}`;
