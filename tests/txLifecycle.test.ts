import { describe, it, expect, vi } from "vitest";
import {
  isTerminalReceiptStatus,
  isAcceptedReceiptStatus,
  isDisagreedReceiptStatus,
  isTimeoutReceiptStatus,
  verifyRegistrationReadback,
  verifyResolutionReadback,
  verifyChallengeReadback,
  verifyFinalizeReadback,
} from "../src/lib/txLifecycle";
import { mapRevertReason, REVERT_MAP } from "../src/lib/revertMap";
import { validateSourceUrl } from "../src/lib/validators";
import type { CommitmentRecord } from "../src/lib/outcome";

describe("Transaction Lifecycle & State Confirmation Tests (B4)", () => {
  describe("isTerminalReceiptStatus", () => {
    it("identifies ACCEPTED and FINALIZED as terminal receipt states", () => {
      expect(isTerminalReceiptStatus("ACCEPTED")).toBe(true);
      expect(isTerminalReceiptStatus("FINALIZED")).toBe(true);
      expect(isTerminalReceiptStatus("5")).toBe(true);
      expect(isTerminalReceiptStatus("7")).toBe(true);
      expect(isTerminalReceiptStatus(5)).toBe(true);
      expect(isTerminalReceiptStatus(7)).toBe(true);
    });

    it("identifies terminal non-success states (disagreed, timeout, canceled)", () => {
      expect(isTerminalReceiptStatus("UNDETERMINED")).toBe(true);
      expect(isTerminalReceiptStatus("MAJORITY_DISAGREE")).toBe(true);
      expect(isTerminalReceiptStatus("CANCELED")).toBe(true);
      expect(isTerminalReceiptStatus("VALIDATORS_TIMEOUT")).toBe(true);
      expect(isTerminalReceiptStatus("LEADER_TIMEOUT")).toBe(true);
      expect(isTerminalReceiptStatus("6")).toBe(true);
      expect(isTerminalReceiptStatus("8")).toBe(true);
      expect(isTerminalReceiptStatus("12")).toBe(true);
      expect(isTerminalReceiptStatus("13")).toBe(true);
    });

    it("returns false for in-flight or undefined statuses", () => {
      expect(isTerminalReceiptStatus("PENDING")).toBe(false);
      expect(isTerminalReceiptStatus("RUNNING")).toBe(false);
      expect(isTerminalReceiptStatus("EXECUTING")).toBe(false);
      expect(isTerminalReceiptStatus(undefined)).toBe(false);
      expect(isTerminalReceiptStatus(null)).toBe(false);
      expect(isTerminalReceiptStatus("")).toBe(false);
    });
  });

  describe("isAcceptedReceiptStatus", () => {
    it("returns true only for validator acceptance", () => {
      expect(isAcceptedReceiptStatus("ACCEPTED")).toBe(true);
      expect(isAcceptedReceiptStatus("FINALIZED")).toBe(true);
      expect(isAcceptedReceiptStatus("5")).toBe(true);
      expect(isAcceptedReceiptStatus("7")).toBe(true);
    });

    it("returns false for non-accepted statuses", () => {
      expect(isAcceptedReceiptStatus("UNDETERMINED")).toBe(false);
      expect(isAcceptedReceiptStatus("MAJORITY_DISAGREE")).toBe(false);
      expect(isAcceptedReceiptStatus("CANCELED")).toBe(false);
      expect(isAcceptedReceiptStatus("PENDING")).toBe(false);
      expect(isAcceptedReceiptStatus(null)).toBe(false);
    });
  });

  describe("isDisagreedReceiptStatus", () => {
    it("returns true for quorum failure / majority disagree", () => {
      expect(isDisagreedReceiptStatus("UNDETERMINED")).toBe(true);
      expect(isDisagreedReceiptStatus("MAJORITY_DISAGREE")).toBe(true);
      expect(isDisagreedReceiptStatus("6")).toBe(true);
      expect(isDisagreedReceiptStatus("ACCEPTED", "MAJORITY_DISAGREE")).toBe(true);
    });

    it("returns false when validators agreed", () => {
      expect(isDisagreedReceiptStatus("ACCEPTED", "MAJORITY_AGREE")).toBe(false);
      expect(isDisagreedReceiptStatus("FINALIZED")).toBe(false);
      expect(isDisagreedReceiptStatus("PENDING")).toBe(false);
    });
  });

  describe("isTimeoutReceiptStatus", () => {
    it("identifies leader and validator timeouts", () => {
      expect(isTimeoutReceiptStatus("VALIDATORS_TIMEOUT")).toBe(true);
      expect(isTimeoutReceiptStatus("LEADER_TIMEOUT")).toBe(true);
      expect(isTimeoutReceiptStatus("TIMEOUT")).toBe(true);
      expect(isTimeoutReceiptStatus("12")).toBe(true);
      expect(isTimeoutReceiptStatus("13")).toBe(true);
    });

    it("returns false for normal statuses", () => {
      expect(isTimeoutReceiptStatus("ACCEPTED")).toBe(false);
      expect(isTimeoutReceiptStatus("PENDING")).toBe(false);
    });
  });

  describe("Post-Transaction State Readback Functions", () => {
    it("verifyRegistrationReadback succeeds when commitment is confirmed OPEN", async () => {
      const mockRead = vi.fn().mockResolvedValue({
        ok: true,
        data: {
          commitment_id: "test12345678",
          status: "OPEN",
          raw_text: "Test commitment statement",
        } as CommitmentRecord,
      });

      const res = await verifyRegistrationReadback("test12345678", "Test commitment statement", mockRead);
      expect(res.confirmed).toBe(true);
      expect(res.record?.status).toBe("OPEN");
    });

    it("verifyRegistrationReadback fails if record remains null", async () => {
      const mockRead = vi.fn().mockResolvedValue({ ok: false, data: null });
      const res = await verifyRegistrationReadback("missing12345", "Text", mockRead, 5);
      expect(res.confirmed).toBe(false);
      expect(res.error).toBeDefined();
    });

    it("verifyResolutionReadback confirms PROVISIONAL status with outcome", async () => {
      const mockRead = vi.fn().mockResolvedValue({
        ok: true,
        data: {
          commitment_id: "res123456789",
          status: "PROVISIONAL",
          outcome: "KEPT",
          decisions: [{ n: 1, kind: "INITIAL", outcome: "KEPT" }],
        } as unknown as CommitmentRecord,
      });

      const res = await verifyResolutionReadback("res123456789", mockRead);
      expect(res.confirmed).toBe(true);
      expect(res.record?.outcome).toBe("KEPT");
    });

    it("verifyChallengeReadback confirms decision count increase", async () => {
      const mockRead = vi.fn().mockResolvedValue({
        ok: true,
        data: {
          commitment_id: "chal12345678",
          status: "PROVISIONAL",
          outcome: "BROKEN",
          decisions: [
            { n: 1, kind: "INITIAL", outcome: "KEPT" },
            { n: 2, kind: "CHALLENGE", outcome: "BROKEN", review_result: "REVISED" },
          ],
        } as unknown as CommitmentRecord,
      });

      const res = await verifyChallengeReadback("chal12345678", 1, mockRead);
      expect(res.confirmed).toBe(true);
    });

    it("verifyChallengeReadback confirms WITHDRAWN resets to status OPEN", async () => {
      const mockRead = vi.fn().mockResolvedValue({
        ok: true,
        data: {
          commitment_id: "chal12345678",
          status: "OPEN",
          outcome: null,
          decisions: [
            { n: 1, kind: "INITIAL", outcome: "KEPT" },
            { n: 2, kind: "CHALLENGE", outcome: null, review_result: "WITHDRAWN" },
          ],
        } as unknown as CommitmentRecord,
      });

      const res = await verifyChallengeReadback("chal12345678", 1, mockRead);
      expect(res.confirmed).toBe(true);
      expect(res.record?.status).toBe("OPEN");
    });

    it("verifyFinalizeReadback confirms FINAL status with finalized_at", async () => {
      const mockRead = vi.fn().mockResolvedValue({
        ok: true,
        data: {
          commitment_id: "fin123456789",
          status: "FINAL",
          finalized_at: "2026-10-14T11:21:12Z",
        } as unknown as CommitmentRecord,
      });

      const res = await verifyFinalizeReadback("fin123456789", mockRead);
      expect(res.confirmed).toBe(true);
      expect(res.record?.status).toBe("FINAL");
    });
  });

  describe("Revert Message Mapping for v3.1.0 Strings", () => {
    const v31RevertStrings = [
      "raw_text must be 1..400 chars",
      "raw_text contains invalid characters (pure ASCII required)",
      "deadline must be YYYY-MM-DD",
      "deadline date is invalid calendar date",
      "claim_kind must be SELF_DECLARED or THIRD_PARTY_REPORT",
      "deadline is not after registration date; set retrospective_ack to record a historical claim",
      "retrospective_ack is only valid when registering on or after deadline date",
      "source_url must be HTTPS",
      "source_url domain not in authorized allowlist",
      "cannot resolve before deadline date",
      "commitment is not in provisional status",
      "challenge window has expired",
      "challenge window still open",
      "maximum decision limit reached",
      "commitment is not in open status",
      "source does not match this commitment",
      "source does not ground this commitment",
      "challenge_reason must be one of the recognized categories",
    ];

    it.each(v31RevertStrings)("maps revert string '%s' to a friendly message", (rawRevert) => {
      const mapped = mapRevertReason(rawRevert);
      expect(mapped).toBeDefined();
      expect(mapped.friendlyMessage.length).toBeGreaterThan(10);
      expect(mapped.category).toBeDefined();
    });
  });

  describe("URL Allowlist Subdomain & Exact Match Validation", () => {
    it("accepts all 7 canonical allowlisted domains", () => {
      const allowed = [
        "https://en.wikipedia.org/wiki/Apollo_11",
        "https://www.reuters.com/world/article-id",
        "https://apnews.com/article/press-release",
        "https://www.bbc.com/news/science-environment",
        "https://www.nasa.gov/press-release/mission-update",
        "https://www.noaa.gov/news/climate-report",
        "https://www.ecb.europa.eu/press/pr/date/html/index.en.html",
      ];
      for (const u of allowed) {
        expect(validateSourceUrl(u).ok).toBe(true);
      }
    });

    it("rejects subdomain spoofing attempts", () => {
      const spoofingUrls = [
        "https://wikipedia.org.attacker.com/wiki/Apollo_11",
        "https://reuters.com.evil.io/article",
        "https://fake-bbc.com/news",
        "https://apnews.com.phishing.net",
        "https://nasa.gov.badactor.org",
      ];
      for (const u of spoofingUrls) {
        const res = validateSourceUrl(u);
        expect(res.ok).toBe(false);
        expect(res.code).toBe("domain_not_allowlisted");
      }
    });
  });

  describe("Challenge Window Countdown & Finalize Enablement Logic", () => {
    function computeFinalizeEligibility(
      remainingSec: number,
      decisionsCount: number
    ): boolean {
      const isWindowOpen = remainingSec > 0;
      const isBudgetExhausted = decisionsCount >= 3;
      return !isWindowOpen || isBudgetExhausted;
    }

    it("disables finalize when challenge window is active and decisions < 3", () => {
      expect(computeFinalizeEligibility(599, 1)).toBe(false);
      expect(computeFinalizeEligibility(300, 2)).toBe(false);
      expect(computeFinalizeEligibility(1, 1)).toBe(false);
    });

    it("enables finalize when 600s challenge window has elapsed", () => {
      expect(computeFinalizeEligibility(0, 1)).toBe(true);
      expect(computeFinalizeEligibility(0, 2)).toBe(true);
    });

    it("enables finalize when decisions budget is exhausted (3/3) even if window active", () => {
      expect(computeFinalizeEligibility(450, 3)).toBe(true);
      expect(computeFinalizeEligibility(600, 3)).toBe(true);
    });

    it("enables finalize when both window elapsed and decisions >= 3", () => {
      expect(computeFinalizeEligibility(0, 3)).toBe(true);
    });
  });
});
