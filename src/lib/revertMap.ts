export interface RevertInfo {
  friendlyMessage: string;
  severity: "error" | "warning" | "info";
  commitmentStaysOpen: boolean;
  category: "input" | "policy" | "source" | "state" | "consensus";
}

export const REVERT_MAP: Record<string, RevertInfo> = {
  "empty raw_text": {
    friendlyMessage: "The commitment text is empty.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "input",
  },
  "raw_text exceeds 400 characters": {
    friendlyMessage: "The commitment text exceeds the 400 character limit.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "input",
  },
  "deadline_hint must be YYYY-MM-DD": {
    friendlyMessage: "The deadline must be a strict calendar date formatted as YYYY-MM-DD.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "input",
  },
  "commitment not found": {
    friendlyMessage: "No commitment with this ID exists in ledger storage.",
    severity: "error",
    commitmentStaysOpen: false,
    category: "state",
  },
  "commitment already resolved": {
    friendlyMessage: "This commitment has already reached resolution and is permanently sealed.",
    severity: "error",
    commitmentStaysOpen: false,
    category: "state",
  },
  "empty source_url": {
    friendlyMessage: "The resolution source URL is empty.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "input",
  },
  "source_url exceeds maximum length of 300 characters": {
    friendlyMessage: "The resolution source URL exceeds the 300 character maximum length.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "input",
  },
  "source_url cannot contain whitespace": {
    friendlyMessage: "The resolution source URL contains whitespace characters.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "input",
  },
  "source_url scheme must be https": {
    friendlyMessage: "Only secure https:// URLs are permitted.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "policy",
  },
  "source_url hostname is missing": {
    friendlyMessage: "The provided source URL is missing a hostname.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "input",
  },
  "source_url cannot contain userinfo": {
    friendlyMessage: "User credentials inside the URL are strictly forbidden.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "policy",
  },
  "source_url port must be 443 or omitted": {
    friendlyMessage: "Non-standard network ports are prohibited (must be 443 or omitted).",
    severity: "error",
    commitmentStaysOpen: true,
    category: "policy",
  },
  "source_url hostname must be pure ASCII": {
    friendlyMessage: "The URL hostname contains non-ASCII characters.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "policy",
  },
  "source_url hostname cannot be punycode": {
    friendlyMessage: "Punycode (internationalized) domains are disallowed.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "policy",
  },
  "source_url hostname cannot be an IP address": {
    friendlyMessage: "Direct IP address literals are disallowed.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "policy",
  },
  "source_url domain not in authorized allowlist": {
    friendlyMessage: "The domain is not in the contract allowlist (Wikipedia, Reuters, AP, BBC, NASA, NOAA, ECB).",
    severity: "error",
    commitmentStaysOpen: true,
    category: "policy",
  },
  "clock unavailable": {
    friendlyMessage: "The deterministic message clock was unavailable from consensus.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "consensus",
  },
  "cannot resolve before deadline date": {
    friendlyMessage: "The commitment deadline has not yet arrived on the chain clock.",
    severity: "warning",
    commitmentStaysOpen: true,
    category: "policy",
  },
  "source fetch failed": {
    friendlyMessage: "The validators could not fetch the source page or the page returned empty content.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "source",
  },
  "source does not match this commitment": {
    friendlyMessage: "The cited source text does not describe the specific subject and action of this commitment (distractor or unrelated topic).",
    severity: "info",
    commitmentStaysOpen: true,
    category: "source",
  },
  "no grounded quote in source": {
    friendlyMessage: "The evidence quote was not found verbatim in the fetched text or is under 12 characters.",
    severity: "info",
    commitmentStaysOpen: true,
    category: "source",
  },
  "model returned no valid outcome": {
    friendlyMessage: "Consensus model failed to produce a valid outcome (KEPT, BROKEN, or PARTIAL).",
    severity: "error",
    commitmentStaysOpen: true,
    category: "consensus",
  },
  "malformed consensus result": {
    friendlyMessage: "Consensus return format was malformed or unexpected.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "consensus",
  },
  "claim_kind must be SELF_DECLARED or THIRD_PARTY_REPORT": {
    friendlyMessage: "Claim kind must be specified as either SELF_DECLARED or THIRD_PARTY_REPORT.",
    severity: "error",
    commitmentStaysOpen: true,
    category: "input",
  },
  "deadline is not after registration date; set retrospective_ack to record a historical claim": {
    friendlyMessage: "The registered deadline is in the past. To record historical analysis, you must acknowledge retrospective registration.",
    severity: "warning",
    commitmentStaysOpen: true,
    category: "policy",
  },
  "commitment is not in provisional status": {
    friendlyMessage: "This commitment is not currently in provisional status and cannot be challenged or concluded.",
    severity: "error",
    commitmentStaysOpen: false,
    category: "state",
  },
  "commitment is final": {
    friendlyMessage: "This commitment has already reached final adjudication and cannot be modified.",
    severity: "error",
    commitmentStaysOpen: false,
    category: "state",
  },
  "challenge window has expired": {
    friendlyMessage: "The 600-second challenge reconsideration window for this provisional decision has elapsed.",
    severity: "warning",
    commitmentStaysOpen: false,
    category: "state",
  },
  "challenge window still open": {
    friendlyMessage: "The challenge reconsideration window is still open. Finalization is only permitted after window expiration or when the challenge budget is exhausted.",
    severity: "info",
    commitmentStaysOpen: false,
    category: "state",
  },
  "challenge limit reached": {
    friendlyMessage: "The maximum limit of 3 adjudication decisions has been reached for this commitment.",
    severity: "warning",
    commitmentStaysOpen: false,
    category: "state",
  },
  "invalid challenge reason": {
    friendlyMessage: "Challenge reason must be either UNSUPPORTED_CLASSIFICATION or CONFLICTING_EVIDENCE.",
    severity: "error",
    commitmentStaysOpen: false,
    category: "input",
  },
  "source already used for this commitment": {
    friendlyMessage: "This source URL has already been evaluated in an earlier decision for this commitment.",
    severity: "warning",
    commitmentStaysOpen: false,
    category: "source",
  },
  "challenge must re-review the effective source": {
    friendlyMessage: "An UNSUPPORTED_CLASSIFICATION challenge must cite the source URL from the decision being challenged.",
    severity: "error",
    commitmentStaysOpen: false,
    category: "policy",
  },
  "insufficient evidence for a conclusive outcome": {
    friendlyMessage: "Source text lacks sufficient ground truth to satisfy the required element threshold.",
    severity: "warning",
    commitmentStaysOpen: false,
    category: "source",
  },
};

export function mapRevertReason(rawRevert: string | null | undefined): RevertInfo {
  if (!rawRevert) {
    return {
      friendlyMessage: "Transaction reverted with an unknown error.",
      severity: "error",
      commitmentStaysOpen: true,
      category: "consensus",
    };
  }

  const trimmed = rawRevert.trim();
  if (REVERT_MAP[trimmed]) {
    return REVERT_MAP[trimmed];
  }

  return {
    friendlyMessage: `Transaction reverted: ${trimmed}`,
    severity: "error",
    commitmentStaysOpen: true,
    category: "consensus",
  };
}
