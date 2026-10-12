import { studionet } from "genlayer-js/chains";

export const NETWORK_NAME = "GenLayer Studionet";
export const NETWORK_STATUS = "Studionet (Preview)";
export const CHAIN_ID = 61999;
export const RPC_URL = "https://studio.genlayer.com/api";
export const EXPLORER_BASE = "https://explorer-studio.genlayer.com";

// Single canonical place for the contract address
export const CONTRACT_ADDRESS = "0x3155c7c80f4334968d61E1b79f74EB864CF7cb08" as const;
export const CONTRACT_SCHEMA_VERSION = "2.2.0";
export const CONTRACT_DEPLOY_TX = "0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a";
export const CONTRACT_SOURCE_SHA256 = "fe63f0cc5a5788e2e3199919ddb5ee067c4c19c17389a8a250764f8e5299016f";

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

export const MAX_RAW_TEXT_LENGTH = 400;
export const MAX_SOURCE_URL_LENGTH = 300;
export const SOURCE_TRUNCATION_LIMIT = 6000;
export const MIN_QUOTE_LENGTH = 12;
export const MAX_QUOTE_LENGTH = 160;

export const getExplorerAddressUrl = (address: string) =>
  `${EXPLORER_BASE}/address/${address}`;

export const getExplorerTxUrl = (txHash: string) =>
  `${EXPLORER_BASE}/tx/${txHash}`;
