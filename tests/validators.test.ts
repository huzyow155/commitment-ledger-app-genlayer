import { describe, it, expect } from "vitest";
import {
  validateRawText,
  validateDeadlineDate,
  validateSourceUrl,
} from "../src/lib/validators";
import { parseCommitmentStatus, parseCommitmentOutcome } from "../src/lib/outcome";
import { mapRevertReason, REVERT_MAP } from "../src/lib/revertMap";
import { isCommitmentNotFoundError } from "../src/services/contractService";

describe("Validators Unit Tests", () => {
  describe("validateRawText", () => {
    it("accepts valid raw text (1..400 chars, pure ASCII)", () => {
      const res = validateRawText("Apollo 11 will land on the Moon.");
      expect(res.ok).toBe(true);
    });

    it("rejects empty text", () => {
      const res = validateRawText("   ");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("empty_raw_text");
    });

    it("rejects text exceeding 400 characters", () => {
      const longText = "A".repeat(401);
      const res = validateRawText(longText);
      expect(res.ok).toBe(false);
      expect(res.code).toBe("raw_text_exceeds_400");
    });

    it("rejects non-ASCII characters", () => {
      const res = validateRawText("Apollo 11 will land on the Moon – with em dash");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("raw_text_non_ascii");
    });
  });

  describe("validateDeadlineDate", () => {
    it("accepts valid ISO calendar date", () => {
      expect(validateDeadlineDate("1970-01-01").ok).toBe(true);
      expect(validateDeadlineDate("2026-10-12").ok).toBe(true);
    });

    it("accepts any 4-digit year allowed by the contract (0001-01-01, 2105-01-01, 9999-12-31)", () => {
      expect(validateDeadlineDate("0001-01-01").ok).toBe(true);
      expect(validateDeadlineDate("2105-01-01").ok).toBe(true);
      expect(validateDeadlineDate("9999-12-31").ok).toBe(true);
    });

    it("accepts leap year 2024-02-29", () => {
      expect(validateDeadlineDate("2024-02-29").ok).toBe(true);
    });

    it("rejects non-leap year 2025-02-29 and century non-leap 2100-02-29", () => {
      const res = validateDeadlineDate("2025-02-29");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("invalid_day");
      const res2100 = validateDeadlineDate("2100-02-29");
      expect(res2100.ok).toBe(false);
      expect(res2100.code).toBe("invalid_day");
    });

    it("rejects month 13", () => {
      const res = validateDeadlineDate("2025-13-01");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("month_out_of_range");
    });

    it("rejects free text like 'end of Q2'", () => {
      const res = validateDeadlineDate("end of Q2");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("invalid_format");
    });
  });

  describe("validateSourceUrl", () => {
    it("accepts https allowlisted domain", () => {
      const res = validateSourceUrl("https://wikipedia.org/wiki/Apollo_11");
      expect(res.ok).toBe(true);
    });

    it("accepts subdomain of allowlisted domain", () => {
      const res = validateSourceUrl("https://en.wikipedia.org/wiki/Apollo_11");
      expect(res.ok).toBe(true);
    });

    it("accepts trailing dot on domain", () => {
      const res = validateSourceUrl("https://en.wikipedia.org./wiki/Apollo_11");
      expect(res.ok).toBe(true);
    });

    it("accepts uppercase host and normalizes", () => {
      const res = validateSourceUrl("https://EN.WIKIPEDIA.ORG/wiki/Apollo_11");
      expect(res.ok).toBe(true);
    });

    it("rejects insecure scheme http://", () => {
      const res = validateSourceUrl("http://en.wikipedia.org/wiki/Apollo_11");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("scheme_must_be_https");
    });

    it("rejects userinfo", () => {
      const res = validateSourceUrl("https://user:pass@en.wikipedia.org/wiki/Apollo_11");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("userinfo_forbidden");
    });

    it("rejects non-standard port 8443", () => {
      const res = validateSourceUrl("https://en.wikipedia.org:8443/wiki/Apollo_11");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("port_forbidden");
    });

    it("rejects IP literal", () => {
      const res = validateSourceUrl("https://192.168.1.1/wiki/Apollo_11");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("ip_literal_forbidden");
    });

    it("rejects punycode xn--", () => {
      const res = validateSourceUrl("https://xn--wikipedia-0ba.org/test");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("punycode_forbidden");
    });

    it("rejects whitespace inside URL", () => {
      const res = validateSourceUrl("https://en.wikipedia.org/wiki/Apollo 11");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("source_url_contains_whitespace");
    });

    it("rejects URLs longer than 300 characters", () => {
      const longUrl = "https://en.wikipedia.org/wiki/" + "a".repeat(280);
      const res = validateSourceUrl(longUrl);
      expect(res.ok).toBe(false);
      expect(res.code).toBe("source_url_exceeds_length");
    });

    it("MUST reject evilwikipedia.org", () => {
      const res = validateSourceUrl("https://evilwikipedia.org/wiki/Apollo_11");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("domain_not_allowlisted");
    });

    it("MUST reject wikipedia.org.evil.com", () => {
      const res = validateSourceUrl("https://wikipedia.org.evil.com/wiki/Apollo_11");
      expect(res.ok).toBe(false);
      expect(res.code).toBe("domain_not_allowlisted");
    });
  });
});

describe("Outcome & Status Parser Unit Tests", () => {
  it("parses exact tokens for status", () => {
    expect(parseCommitmentStatus("OPEN")).toBe("OPEN");
    expect(parseCommitmentStatus("RESOLVED")).toBe("RESOLVED");
    expect(parseCommitmentStatus("OPEN_SOMETHING")).toBe("UNKNOWN");
    expect(parseCommitmentStatus(123)).toBe("UNKNOWN");
  });

  it("parses exact tokens for outcome", () => {
    expect(parseCommitmentOutcome("KEPT")).toBe("KEPT");
    expect(parseCommitmentOutcome("BROKEN")).toBe("BROKEN");
    expect(parseCommitmentOutcome("PARTIAL")).toBe("PARTIAL");
    expect(parseCommitmentOutcome(null)).toBe(null);
    expect(parseCommitmentOutcome(undefined)).toBe(null);
    expect(parseCommitmentOutcome("MAYBE")).toBe("UNKNOWN");
    expect(parseCommitmentOutcome("KEPT_EXTRA")).toBe("UNKNOWN");
  });
});

describe("Revert Mapper Unit Tests", () => {
  const allRevertStrings = [
    "empty raw_text",
    "raw_text exceeds 400 characters",
    "deadline_hint must be YYYY-MM-DD",
    "commitment not found",
    "commitment already resolved",
    "empty source_url",
    "source_url exceeds maximum length of 300 characters",
    "source_url cannot contain whitespace",
    "source_url scheme must be https",
    "source_url hostname is missing",
    "source_url cannot contain userinfo",
    "source_url port must be 443 or omitted",
    "source_url hostname must be pure ASCII",
    "source_url hostname cannot be punycode",
    "source_url hostname cannot be an IP address",
    "source_url domain not in authorized allowlist",
    "clock unavailable",
    "cannot resolve before deadline date",
    "source fetch failed",
    "source does not match this commitment",
    "no grounded quote in source",
    "model returned no valid outcome",
    "malformed consensus result",
  ];

  it("every specified revert string has an entry in REVERT_MAP", () => {
    for (const str of allRevertStrings) {
      expect(REVERT_MAP[str]).toBeDefined();
      const mapped = mapRevertReason(str);
      expect(mapped.friendlyMessage).toBeTruthy();
    }
  });

  it("falls back gracefully for unknown revert string", () => {
    const res = mapRevertReason("Some mysterious VM error");
    expect(res.friendlyMessage).toContain("Some mysterious VM error");
    expect(res.commitmentStaysOpen).toBe(true);
  });
});

describe("isCommitmentNotFoundError Unit Tests", () => {
  it("classifies real Studionet gen_call InvalidInputRpcError shape as not-found", () => {
    const studionetErr = Object.assign(
      new Error(
        "Missing or invalid parameters.\nDouble check you have provided the correct parameters.\n\nDetails: execution failed\nVersion: viem@2.57.4"
      ),
      {
        name: "InvalidInputRpcError",
        code: -32000,
        details: "execution failed",
        shortMessage:
          "Missing or invalid parameters.\nDouble check you have provided the correct parameters.",
        cause: {
          code: -32000,
          message: "execution failed",
          data: {},
        },
      }
    );
    expect(isCommitmentNotFoundError(studionetErr)).toBe(true);
  });

  it("classifies exact revert strings and exact revert suffixes as not-found", () => {
    expect(isCommitmentNotFoundError(new Error("commitment not found"))).toBe(true);
    expect(isCommitmentNotFoundError(new Error("UserError: commitment not found"))).toBe(true);
    expect(isCommitmentNotFoundError(new Error("gen_call failed: commitment not found"))).toBe(true);
  });

  it("does NOT classify adversarial or unrelated errors containing the substring as not-found", () => {
    expect(
      isCommitmentNotFoundError(
        new Error("the commitment not found in your list of favorites")
      )
    ).toBe(false);
    expect(
      isCommitmentNotFoundError(
        new Error("commitment not found in local cache, please retry")
      )
    ).toBe(false);
    expect(isCommitmentNotFoundError(new Error("not found commitment"))).toBe(false);
    expect(isCommitmentNotFoundError(new Error("HTTP 502 Bad Gateway"))).toBe(false);
    expect(
      isCommitmentNotFoundError({
        code: -32603,
        details: "internal server error",
        message: "Internal error",
      })
    ).toBe(false);
  });
});
