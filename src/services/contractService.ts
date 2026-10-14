import { createClient } from "genlayer-js";
import { CONTRACT_ADDRESS, GENLAYER_CHAIN, RPC_URL, type ClaimKind, type ChallengeReason } from "../config/chain";
import {
  parseCommitmentOutcome,
  parseCommitmentStatus,
  type CommitmentRecord,
  type DecisionRecord,
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
 * Classifies whether a thrown readContract error from get_commitment represents
 * a genuine on-chain `gl.vm.UserError("commitment not found")` revert rather than
 * an arbitrary RPC/network failure or substring coincidence.
 */
export function isCommitmentNotFoundError(err: unknown): boolean {
  if (err && typeof err === "object") {
    const errObj = err as {
      code?: unknown;
      details?: unknown;
      message?: unknown;
      cause?: { code?: unknown; message?: unknown };
    };
    const details = typeof errObj.details === "string" ? errObj.details.trim() : "";
    const causeMsg =
      errObj.cause && typeof errObj.cause.message === "string"
        ? errObj.cause.message.trim()
        : "";
    const code = errObj.code ?? errObj.cause?.code;

    if (
      code === -32000 &&
      (details === "execution failed" ||
        causeMsg === "execution failed" ||
        details === "commitment not found" ||
        details.endsWith(": commitment not found") ||
        details.endsWith("UserError: commitment not found") ||
        causeMsg === "commitment not found" ||
        causeMsg.endsWith(": commitment not found") ||
        causeMsg.endsWith("UserError: commitment not found"))
    ) {
      return true;
    }
  }

  const errMsg = err instanceof Error ? err.message : String(err ?? "");
  const trimmed = errMsg.trim();
  return (
    trimmed === "commitment not found" ||
    trimmed.endsWith(": commitment not found") ||
    trimmed.endsWith("UserError: commitment not found")
  );
}

function mapRawRecord(parsed: any, fallbackId: string = ""): CommitmentRecord {
  return {
    schema_version: String(parsed.schema_version || "3.0.0"),
    commitment_id: String(parsed.commitment_id || fallbackId),
    registrant: String(parsed.registrant || ""),
    raw_text: String(parsed.raw_text || ""),
    subject: String(parsed.subject || ""),
    action: String(parsed.action || ""),
    deadline_hint: String(parsed.deadline_hint || ""),
    registered_at: parsed.registered_at ? String(parsed.registered_at) : undefined,
    registered_at_ts: parsed.registered_at_ts ? Number(parsed.registered_at_ts) : undefined,
    registered_date: parsed.registered_date ? String(parsed.registered_date) : undefined,
    registration_class: parsed.registration_class ? String(parsed.registration_class) : undefined,
    record_class: parsed.record_class ? String(parsed.record_class) : undefined,
    claim_kind: parsed.claim_kind ? String(parsed.claim_kind) : undefined,
    identity_verified: Boolean(parsed.identity_verified),
    created_round: Number(parsed.created_round || 0),
    status: parseCommitmentStatus(parsed.status),
    challenge_deadline_ts: parsed.challenge_deadline_ts ? Number(parsed.challenge_deadline_ts) : null,
    current_decision_index: parsed.current_decision_index !== undefined ? Number(parsed.current_decision_index) : undefined,
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    outcome: parseCommitmentOutcome(parsed.outcome),
    source_url: parsed.source_url ? String(parsed.source_url) : null,
    resolution_quote: parsed.resolution_quote ? String(parsed.resolution_quote) : null,
    match_confirmed: Boolean(parsed.match_confirmed),
    resolved_at: parsed.resolved_at ? String(parsed.resolved_at) : null,
    resolver: parsed.resolver ? String(parsed.resolver) : null,
    finalized_at: parsed.finalized_at ? String(parsed.finalized_at) : null,
  };
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
    return { ok: true, data: mapRawRecord(parsed, commitmentId) };
  } catch (err: unknown) {
    if (isCommitmentNotFoundError(err)) {
      return { ok: true, data: null, isNotFound: true };
    }
    const errMsg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: errMsg };
  }
}

/**
 * Reads decision history for a commitment.
 */
export async function getDecisionHistory(
  commitmentId: string
): Promise<ContractReadResult<DecisionRecord[]>> {
  const client = getGenLayerClient();
  try {
    const rawResult = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_decision_history",
      args: [commitmentId.trim()],
    });

    if (!rawResult || typeof rawResult !== "string") {
      return { ok: true, data: [] };
    }

    const parsed = JSON.parse(rawResult);
    if (!Array.isArray(parsed)) {
      return { ok: false, error: "Contract returned non-array decisions." };
    }
    return { ok: true, data: parsed };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
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

    const records: CommitmentRecord[] = parsedList.map((item: any) =>
      mapRawRecord(item, item.commitment_id)
    );

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
 * Registers commitment using 4 parameters (raw_text, deadline_hint, claim_kind, retrospective_ack):
 * 1. Snapshot list_commitments_by_registrant(addr, 25)
 * 2. Send register_commitment(raw_text, deadline_hint, claim_kind, retrospective_ack)
 * 3. Poll receipt
 * 4. Read list_commitments_by_registrant AFTER
 * 5. Discover the new commitment ID
 */
export async function registerCommitmentFlow(
  account: any,
  rawText: string,
  deadlineHint: string,
  claimKind: ClaimKind = "THIRD_PARTY_REPORT",
  retrospectiveAck: boolean = false,
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
    args: [rawText.trim(), deadlineHint.trim(), claimKind, retrospectiveAck],
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

/**
 * Challenges a provisional resolution with a stated reason and supporting source URL.
 */
export async function challengeResolutionFlow(
  account: any,
  commitmentId: string,
  reason: ChallengeReason,
  sourceUrl: string,
  onStatusUpdate?: (status: TxStatusReport) => void
): Promise<{ txHash: string; report: TxStatusReport }> {
  const client = getGenLayerClient(account);
  const txHash: string = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "challenge_resolution",
    args: [commitmentId.trim(), reason, sourceUrl.trim()],
    value: 0n,
  } as any);

  const report = await pollTransactionReceipt(txHash, onStatusUpdate);
  return { txHash, report };
}

/**
 * Finalizes a resolution after the challenge window expires or decision budget is exhausted.
 */
export async function finalizeResolutionFlow(
  account: any,
  commitmentId: string,
  onStatusUpdate?: (status: TxStatusReport) => void
): Promise<{ txHash: string; report: TxStatusReport }> {
  const client = getGenLayerClient(account);
  const txHash: string = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "finalize_resolution",
    args: [commitmentId.trim()],
    value: 0n,
  } as any);

  const report = await pollTransactionReceipt(txHash, onStatusUpdate);
  return { txHash, report };
}
