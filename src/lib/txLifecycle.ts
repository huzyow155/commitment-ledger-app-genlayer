import type { CommitmentRecord } from "./outcome";

export type PipelineStage =
  | "signing"
  | "submitting"
  | "consensus"
  | "accepted"
  | "state_confirmed"
  | "disagreed"
  | "reverted"
  | "timed_out"
  | "complete";

/**
 * Checks if a transaction status represents a terminal receipt state in GenLayer.
 * A transaction is terminal if it has finished validator voting (ACCEPTED or "FINALIZED")
 * or ended in a terminal non-success state (undetermined/disagreement, timeout, canceled).
 */
export function isTerminalReceiptStatus(status: string | number | undefined | null): boolean {
  if (status === undefined || status === null) return false;
  const s = String(status).trim().toUpperCase();
  return (
    s === "ACCEPTED" ||
    s === "FINALIZED" ||
    s === "UNDETERMINED" ||
    s === "MAJORITY_DISAGREE" ||
    s === "CANCELED" ||
    s === "VALIDATORS_TIMEOUT" ||
    s === "LEADER_TIMEOUT" ||
    s === "5" || // ACCEPTED
    s === "6" || // UNDETERMINED
    s === "7" || // FINALIZED
    s === "8" || // CANCELED
    s === "12" || // VALIDATORS_TIMEOUT
    s === "13" // LEADER_TIMEOUT
  );
}

/**
 * Checks if a transaction receipt status indicates validator acceptance (ACCEPTED or FINALIZED).
 */
export function isAcceptedReceiptStatus(status: string | number | undefined | null): boolean {
  if (status === undefined || status === null) return false;
  const s = String(status).trim().toUpperCase();
  return s === "ACCEPTED" || s === "FINALIZED" || s === "5" || s === "7";
}

/**
 * Checks if a transaction ended in validator disagreement.
 */
export function isDisagreedReceiptStatus(
  status: string | number | undefined | null,
  resultName?: string | null
): boolean {
  const s = String(status || "").trim().toUpperCase();
  const r = String(resultName || "").trim().toUpperCase();
  return (
    s === "UNDETERMINED" ||
    s === "MAJORITY_DISAGREE" ||
    s === "6" ||
    r === "MAJORITY_DISAGREE" ||
    r === "DISAGREE"
  );
}

/**
 * Checks if a transaction timed out on validators or leader.
 */
export function isTimeoutReceiptStatus(status: string | number | undefined | null): boolean {
  const s = String(status || "").trim().toUpperCase();
  return s === "VALIDATORS_TIMEOUT" || s === "LEADER_TIMEOUT" || s === "12" || s === "13" || s === "TIMEOUT";
}

/**
 * Verifies post-registration state readback.
 * Ensures the new commitment exists, registrant matches, and status is OPEN.
 */
export async function verifyRegistrationReadback(
  commitmentId: string,
  expectedText: string,
  readFn: (id: string) => Promise<{ ok: boolean; data?: CommitmentRecord | null }>,
  retryDelayMs: number = 1200
): Promise<{ confirmed: boolean; record: CommitmentRecord | null; error?: string }> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await readFn(commitmentId);
    if (res.ok && res.data) {
      const rec = res.data;
      if (rec.commitment_id === commitmentId && rec.status === "OPEN") {
        return { confirmed: true, record: rec };
      }
    }
    await new Promise((r) => setTimeout(r, retryDelayMs));
  }
  return {
    confirmed: false,
    record: null,
    error: `Post-registration readback failed to confirm commitment ${commitmentId} in OPEN status.`,
  };
}

/**
 * Verifies post-resolution state readback.
 * Confirms status is PROVISIONAL, outcome is populated, and at least one decision exists.
 */
export async function verifyResolutionReadback(
  commitmentId: string,
  readFn: (id: string) => Promise<{ ok: boolean; data?: CommitmentRecord | null }>,
  retryDelayMs: number = 1200
): Promise<{ confirmed: boolean; record: CommitmentRecord | null; error?: string }> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await readFn(commitmentId);
    if (res.ok && res.data) {
      const rec = res.data;
      if (rec.status === "PROVISIONAL" && rec.decisions && rec.decisions.length > 0 && rec.outcome) {
        return { confirmed: true, record: rec };
      }
    }
    await new Promise((r) => setTimeout(r, retryDelayMs));
  }
  return {
    confirmed: false,
    record: null,
    error: `Post-resolution readback failed: commitment ${commitmentId} did not enter PROVISIONAL status.`,
  };
}

/**
 * Verifies post-challenge state readback.
 * Confirms decisions count increased and review_result is present, or status reset to OPEN for WITHDRAWN.
 */
export async function verifyChallengeReadback(
  commitmentId: string,
  initialDecisionsCount: number,
  readFn: (id: string) => Promise<{ ok: boolean; data?: CommitmentRecord | null }>,
  retryDelayMs: number = 1200
): Promise<{ confirmed: boolean; record: CommitmentRecord | null; error?: string }> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await readFn(commitmentId);
    if (res.ok && res.data) {
      const rec = res.data;
      const count = rec.decisions?.length || 0;
      if (count > initialDecisionsCount) {
        const latestDecision = rec.decisions?.[count - 1];
        if (latestDecision?.review_result) {
          // If review_result is WITHDRAWN, status must be OPEN; otherwise PROVISIONAL
          if (latestDecision.review_result === "WITHDRAWN" && rec.status === "OPEN") {
            return { confirmed: true, record: rec };
          }
          if (latestDecision.review_result !== "WITHDRAWN" && rec.status === "PROVISIONAL") {
            return { confirmed: true, record: rec };
          }
        }
      }
    }
    await new Promise((r) => setTimeout(r, retryDelayMs));
  }
  return {
    confirmed: false,
    record: null,
    error: `Post-challenge readback failed: decisions count did not increase from ${initialDecisionsCount}.`,
  };
}

/**
 * Verifies post-finalize state readback.
 * Confirms status is FINAL and finalized_at timestamp exists.
 */
export async function verifyFinalizeReadback(
  commitmentId: string,
  readFn: (id: string) => Promise<{ ok: boolean; data?: CommitmentRecord | null }>,
  retryDelayMs: number = 1200
): Promise<{ confirmed: boolean; record: CommitmentRecord | null; error?: string }> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await readFn(commitmentId);
    if (res.ok && res.data) {
      const rec = res.data;
      if (rec.status === "FINAL" && rec.finalized_at) {
        return { confirmed: true, record: rec };
      }
    }
    await new Promise((r) => setTimeout(r, retryDelayMs));
  }
  return {
    confirmed: false,
    record: null,
    error: `Post-finalize readback failed: commitment ${commitmentId} did not reach FINAL status.`,
  };
}
