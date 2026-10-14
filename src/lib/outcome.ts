export type CommitmentStatus = "OPEN" | "PROVISIONAL" | "FINAL" | "RESOLVED" | "UNKNOWN";
export type CommitmentOutcome = "KEPT" | "BROKEN" | "PARTIAL" | "DISPUTED" | null | "UNKNOWN";

export interface ElementRecord {
  id: string;
  kind: "ACTION" | "CONDITION" | "DEADLINE" | string;
  label: string;
  status: "SATISFIED" | "NOT_SATISFIED" | "UNDETERMINED" | string;
  passage_ids?: number[];
  cited_segment_ids?: number[];
}

export interface PassageRecord {
  id: number;
  text: string;
  sha256: string;
}

export interface DecisionRecord {
  n: number;
  kind: "INITIAL" | "CHALLENGE" | string;
  challenge_reason: string | null;
  resolver: string;
  decided_at: string;
  decided_at_ts: number;
  source_url: string;
  outcome: CommitmentOutcome;
  elements: ElementRecord[];
  passages: PassageRecord[];
  evidence_sha256?: string;
  inspected_text_sha256?: string;
  source_chars_total?: number;
  source_chars_inspected?: number;
  coverage?: string;
  fetch_method?: string;
  review_result?: string | null;
}

export interface CommitmentRecord {
  schema_version: string;
  commitment_id: string;
  registrant: string;
  raw_text: string;
  subject: string;
  action: string;
  deadline_hint: string;
  registered_at?: string;
  registered_at_ts?: number;
  registered_date?: string;
  registration_class?: "PROSPECTIVE" | "RETROSPECTIVE" | string;
  record_class?: "ACCOUNTABILITY" | "HISTORICAL_ANALYSIS" | string;
  claim_kind?: "SELF_DECLARED" | "THIRD_PARTY_REPORT" | string;
  identity_verified?: boolean;
  created_round: number;
  status: CommitmentStatus;
  challenge_deadline_ts?: number | null;
  current_decision_index?: number;
  decisions?: DecisionRecord[];
  outcome: CommitmentOutcome;
  source_url: string | null;
  resolution_quote: string | null;
  match_confirmed: boolean;
  resolved_at: string | null;
  resolver: string | null;
  finalized_at?: string | null;
}

/**
 * Exact-token status parser (no substring or includes)
 */
export function parseCommitmentStatus(val: unknown): CommitmentStatus {
  if (typeof val !== "string") return "UNKNOWN";
  const trimmed = val.trim();
  if (trimmed === "OPEN") return "OPEN";
  if (trimmed === "PROVISIONAL") return "PROVISIONAL";
  if (trimmed === "FINAL") return "FINAL";
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
  if (trimmed === "DISPUTED") return "DISPUTED";
  return "UNKNOWN";
}
