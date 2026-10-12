export type CommitmentStatus = "OPEN" | "RESOLVED" | "UNKNOWN";
export type CommitmentOutcome = "KEPT" | "BROKEN" | "PARTIAL" | null | "UNKNOWN";

export interface CommitmentRecord {
  schema_version: string;
  commitment_id: string;
  registrant: string;
  raw_text: string;
  subject: string;
  action: string;
  deadline_hint: string;
  created_round: number;
  status: CommitmentStatus;
  outcome: CommitmentOutcome;
  source_url: string | null;
  resolution_quote: string | null;
  match_confirmed: boolean;
  resolved_at: string | null;
  resolver: string | null;
}

/**
 * Exact-token status parser (no substring or includes)
 */
export function parseCommitmentStatus(val: unknown): CommitmentStatus {
  if (typeof val !== "string") return "UNKNOWN";
  const trimmed = val.trim();
  if (trimmed === "OPEN") return "OPEN";
  if (trimmed === "RESOLVED") return "RESOLVED";
  return "UNKNOWN";
}

/**
 * Exact-token outcome parser (no substring or includes)
 */
export function parseCommitmentOutcome(val: unknown): CommitmentOutcome {
  if (val === null || val === undefined) return null;
  if (typeof val !== "string") return "UNKNOWN";
  const trimmed = val.trim();
  if (trimmed === "KEPT") return "KEPT";
  if (trimmed === "BROKEN") return "BROKEN";
  if (trimmed === "PARTIAL") return "PARTIAL";
  return "UNKNOWN";
}
