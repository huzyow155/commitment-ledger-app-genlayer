import { createClient } from "genlayer-js";
import { CONTRACT_ADDRESS, GENLAYER_CHAIN, RPC_URL } from "../config/chain";
import {
  parseCommitmentOutcome,
  parseCommitmentStatus,
  type CommitmentRecord,
} from "../lib/outcome";

export type ContractReadResult<T> =
  | { ok: true; data: T; isNotFound?: false }
  | { ok: true; data: null; isNotFound: true }
  | { ok: false; error: string };

export interface LeaderReceiptResult {
  execution_result: "SUCCESS" | "ERROR" | string;
  result?: string;
  decodedRevert?: string;
}

export interface TxStatusReport {
  txHash: string;
  statusName: string; // PENDING, ACCEPTED, UNDETERMINED, etc.
  leaderResult?: "SUCCESS" | "ERROR" | string;
  decodedRevert?: string;
  isMajorityDisagreed?: boolean;
}

/**
 * Creates a GenLayer client instance.
 * If account is provided, writes can be executed.
 */
export function getGenLayerClient(account?: any) {
  return createClient({
    chain: GENLAYER_CHAIN,
    endpoint: RPC_URL,
    account,
  });
}

/**
 * Decodes base64 leader receipt result from GenLayer RPC receipt:
 * leader_receipt[0].result has first byte sliced as status prefix, remainder decoded as UTF-8.
 */
export function decodeLeaderReceiptResult(base64Str: string): string {
  try {
    const binaryStr = atob(base64Str);
    if (binaryStr.length <= 1) return "";
    const sliced = binaryStr.slice(1);
    const bytes = new Uint8Array(sliced.length);
    for (let i = 0; i < sliced.length; i++) {
      bytes[i] = sliced.charCodeAt(i);
    }
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes);
  } catch {
    return "";
  }
}

/**
 * Reads a single commitment by ID.
 * Distinguishes RPC error from genuine 'commitment not found'.
 */
export async function getCommitment(
  commitmentId: string
): Promise<ContractReadResult<CommitmentRecord>> {
  const client = getGenLayerClient();
  try {
    const rawResult = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_commitment",
      args: [commitmentId.trim()],
    });

    if (!rawResult || typeof rawResult !== "string") {
      return { ok: false, error: "Empty or invalid response from contract." };
    }

    const parsed = JSON.parse(rawResult);
    const record: CommitmentRecord = {
      schema_version: String(parsed.schema_version || "2.2.0"),
      commitment_id: String(parsed.commitment_id || commitmentId),
      registrant: String(parsed.registrant || ""),
      raw_text: String(parsed.raw_text || ""),
      subject: String(parsed.subject || ""),
      action: String(parsed.action || ""),
      deadline_hint: String(parsed.deadline_hint || ""),
      created_round: Number(parsed.created_round || 0),
      status: parseCommitmentStatus(parsed.status),
      outcome: parseCommitmentOutcome(parsed.outcome),
      source_url: parsed.source_url ? String(parsed.source_url) : null,
      resolution_quote: parsed.resolution_quote ? String(parsed.resolution_quote) : null,
      match_confirmed: Boolean(parsed.match_confirmed),
      resolved_at: parsed.resolved_at ? String(parsed.resolved_at) : null,
      resolver: parsed.resolver ? String(parsed.resolver) : null,
    };

    return { ok: true, data: record };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("commitment not found") || errMsg.includes("UserError: commitment not found")) {
      return { ok: true, data: null, isNotFound: true };
    }
    return { ok: false, error: errMsg };
  }
}

/**
 * Lists commitments registered by an address (purely read-only view).
 */
export async function listCommitmentsByRegistrant(
  registrant: string,
  limit: number = 20
): Promise<ContractReadResult<CommitmentRecord[]>> {
  const client = getGenLayerClient();
  try {
    const rawResult = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "list_commitments_by_registrant",
      args: [registrant.trim(), limit],
    });

    if (!rawResult || typeof rawResult !== "string") {
      return { ok: true, data: [] };
    }

    const parsedList = JSON.parse(rawResult);
    if (!Array.isArray(parsedList)) {
      return { ok: false, error: "Contract returned non-array payload." };
    }

    const records: CommitmentRecord[] = parsedList.map((item: any) => ({
      schema_version: String(item.schema_version || "2.2.0"),
      commitment_id: String(item.commitment_id || ""),
      registrant: String(item.registrant || registrant),
      raw_text: String(item.raw_text || ""),
      subject: String(item.subject || ""),
      action: String(item.action || ""),
      deadline_hint: String(item.deadline_hint || ""),
      created_round: Number(item.created_round || 0),
      status: parseCommitmentStatus(item.status),
      outcome: parseCommitmentOutcome(item.outcome),
      source_url: item.source_url ? String(item.source_url) : null,
      resolution_quote: item.resolution_quote ? String(item.resolution_quote) : null,
      match_confirmed: Boolean(item.match_confirmed),
      resolved_at: item.resolved_at ? String(item.resolved_at) : null,
      resolver: item.resolver ? String(item.resolver) : null,
    }));

    return { ok: true, data: records };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Polls for transaction receipt with bounded timeout (max 180s).
 */
export async function pollTransactionReceipt(
  txHash: string,
  onStatusUpdate?: (status: TxStatusReport) => void,
  timeoutMs: number = 180000
): Promise<TxStatusReport> {
  const client = getGenLayerClient();
  const startTime = Date.now();
  const pollInterval = 3000;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const tx: any = await client.getTransaction({ hash: txHash as any });
      if (tx) {
        const statusName = tx.status_name || tx.statusName || tx.status || "PENDING";
        let consensusData = tx.consensus_data;
        if (!consensusData) {
          try {
            const rawRpcRes = await fetch(RPC_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_getTransactionByHash",
                params: [txHash],
              }),
            });
            const rawRpcJson = await rawRpcRes.json();
            consensusData = rawRpcJson.result?.consensus_data;
          } catch {
            // ignore
          }
        }

        const leaderReceipts = consensusData?.leader_receipt;

        let leaderResult: string | undefined;
        let decodedRevert: string | undefined;

        if (leaderReceipts && leaderReceipts.length > 0) {
          leaderResult = leaderReceipts[0]?.execution_result;
          const rawResultPayload = leaderReceipts[0]?.result;
          if (rawResultPayload) {
            decodedRevert = decodeLeaderReceiptResult(rawResultPayload);
          }
        }

        const isMajorityDisagreed =
          statusName === "UNDETERMINED" ||
          statusName === "MAJORITY_DISAGREE" ||
          consensusData?.result_name === "MAJORITY_DISAGREE";

        const report: TxStatusReport = {
          txHash,
          statusName: String(statusName),
          leaderResult,
          decodedRevert,
          isMajorityDisagreed,
        };

        if (onStatusUpdate) {
          onStatusUpdate(report);
        }

        if (statusName === "ACCEPTED" || statusName === "FINALIZED" || isMajorityDisagreed) {
          return report;
        }
      }
    } catch {
      // transient RPC poll error; keep trying
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Transaction polling timed out after 180 seconds. Check the explorer for status.");
}

/**
 * Registers commitment using the snapshot-diff method:
 * 1. Snapshot list_commitments_by_registrant(addr, 20)
 * 2. Send register_commitment(raw_text, deadline_hint)
 * 3. Poll receipt
 * 4. Read list_commitments_by_registrant AFTER
 * 5. Discover the new commitment ID
 */
export async function registerCommitmentFlow(
  account: any,
  rawText: string,
  deadlineHint: string,
  onStatusUpdate?: (status: TxStatusReport) => void
): Promise<{ txHash: string; commitmentId: string; report: TxStatusReport }> {
  const addr = account.address;
  const beforeSnapshot = await listCommitmentsByRegistrant(addr, 25);
  const existingIds = new Set(
    beforeSnapshot.ok && beforeSnapshot.data ? beforeSnapshot.data.map((c) => c.commitment_id) : []
  );

  const client = getGenLayerClient(account);
  const txHash: string = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "register_commitment",
    args: [rawText.trim(), deadlineHint.trim()],
    value: 0n,
  } as any);

  const report = await pollTransactionReceipt(txHash, onStatusUpdate);

  if (report.statusName !== "ACCEPTED" || report.leaderResult === "ERROR") {
    throw new Error(report.decodedRevert || `Transaction failed with status ${report.statusName}`);
  }

  // Poll for the new record in registrant list
  for (let i = 0; i < 10; i++) {
    const afterSnapshot = await listCommitmentsByRegistrant(addr, 25);
    if (afterSnapshot.ok && afterSnapshot.data) {
      const match = afterSnapshot.data.find(
        (c) => !existingIds.has(c.commitment_id) && c.raw_text.trim() === rawText.trim()
      );
      if (match) {
        return { txHash, commitmentId: match.commitment_id, report };
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error("Commitment registered on-chain, but failed to locate new ID in list snapshot.");
}

/**
 * Submits resolution source URL for an existing open commitment.
 */
export async function submitResolutionFlow(
  account: any,
  commitmentId: string,
  sourceUrl: string,
  onStatusUpdate?: (status: TxStatusReport) => void
): Promise<{ txHash: string; report: TxStatusReport }> {
  const client = getGenLayerClient(account);
  const txHash: string = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "submit_resolution",
    args: [commitmentId.trim(), sourceUrl.trim()],
    value: 0n,
  } as any);

  const report = await pollTransactionReceipt(txHash, onStatusUpdate);
  return { txHash, report };
}
