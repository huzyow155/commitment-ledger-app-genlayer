import { ALLOWED_DOMAINS, MAX_RAW_TEXT_LENGTH, MAX_SOURCE_URL_LENGTH } from "../config/chain";

export interface ValidationResult {
  ok: boolean;
  code: string;
  message: string;
}

/**
 * Validates raw_text input mirroring the contract:
 * strip() length must be 1..400 chars, pure ASCII
 */
export function validateRawText(text: string): ValidationResult {
  const stripped = text.trim();
  if (stripped.length === 0) {
    return { ok: false, code: "empty_raw_text", message: "Commitment text cannot be empty." };
  }
  if (stripped.length > MAX_RAW_TEXT_LENGTH) {
    return {
      ok: false,
      code: "raw_text_exceeds_400",
      message: `Commitment text exceeds ${MAX_RAW_TEXT_LENGTH} characters (${stripped.length} chars).`,
    };
  }
  // Check pure ASCII
  for (let i = 0; i < stripped.length; i++) {
    if (stripped.charCodeAt(i) > 127) {
      return {
        ok: false,
        code: "raw_text_non_ascii",
        message: "Commitment text must contain ASCII characters only.",
      };
    }
  }
  return { ok: true, code: "valid", message: "Valid commitment text." };
}

/**
 * Validates strict calendar date YYYY-MM-DD including leap year calculation.
 * Contract rules:
 * - Match ^\d{4}-\d{2}-\d{2}$
 * - Year 1900..2100
 * - Month 1..12
 * - Days per month respecting leap years (divisible by 4 and not 100, or divisible by 400)
 */
export function validateDeadlineDate(dateStr: string): ValidationResult {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return {
      ok: false,
      code: "invalid_format",
      message: "Deadline must strictly be formatted as YYYY-MM-DD.",
    };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1900 || year > 2100) {
    return {
      ok: false,
      code: "year_out_of_range",
      message: "Year must be between 1900 and 2100.",
    };
  }

  if (month < 1 || month > 12) {
    return {
      ok: false,
      code: "month_out_of_range",
      message: "Month must be between 01 and 12.",
    };
  }

  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const maxDays = month === 2 && isLeapYear ? 29 : daysInMonths[month - 1];

  if (day < 1 || day > maxDays) {
    return {
      ok: false,
      code: "invalid_day",
      message: `Invalid calendar day for ${year}-${match[2]} (max ${maxDays} days).`,
    };
  }

  return { ok: true, code: "valid", message: "Valid deadline date." };
}

/**
 * Validates source_url mirroring contract _validate_source_url:
 * - <= 300 chars
 * - no whitespace
 * - scheme === https
 * - host present, no userinfo, port 443 or omitted
 * - host pure ASCII, no punycode (xn--), no IP address
 * - host === allowed_domain or host.endsWith('.' + allowed_domain)
 */
export function validateSourceUrl(urlStr: string): ValidationResult {
  const raw = urlStr.trim();
  if (raw.length === 0) {
    return { ok: false, code: "empty_source_url", message: "Source URL cannot be empty." };
  }
  if (raw.length > MAX_SOURCE_URL_LENGTH) {
    return {
      ok: false,
      code: "source_url_exceeds_length",
      message: `Source URL exceeds ${MAX_SOURCE_URL_LENGTH} characters.`,
    };
  }
  if (/\s/.test(raw)) {
    return {
      ok: false,
      code: "source_url_contains_whitespace",
      message: "Source URL cannot contain whitespace.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return {
      ok: false,
      code: "invalid_url_syntax",
      message: "Malformed URL syntax.",
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      ok: false,
      code: "scheme_must_be_https",
      message: "Source URL protocol must be https://.",
    };
  }

  if (parsed.username || parsed.password) {
    return {
      ok: false,
      code: "userinfo_forbidden",
      message: "Source URL cannot contain user credentials.",
    };
  }

  if (parsed.port && parsed.port !== "443") {
    return {
      ok: false,
      code: "port_forbidden",
      message: "Source URL port must be 443 or omitted.",
    };
  }

  let hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    return {
      ok: false,
      code: "hostname_missing",
      message: "Source URL hostname is missing.",
    };
  }

  // Strip trailing dot if any
  if (hostname.endsWith(".")) {
    hostname = hostname.slice(0, -1);
  }

  // Check pure ASCII host
  for (let i = 0; i < hostname.length; i++) {
    if (hostname.charCodeAt(i) > 127) {
      return {
        ok: false,
        code: "hostname_non_ascii",
        message: "Hostname must be pure ASCII.",
      };
    }
  }

  if (hostname.includes("xn--")) {
    return {
      ok: false,
      code: "punycode_forbidden",
      message: "Punycode (internationalized) domains are not allowed.",
    };
  }

  // IPv4 / IPv6 checks
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const isIpv6 = hostname.startsWith("[") || hostname.includes(":");
  if (isIpv4 || isIpv6) {
    return {
      ok: false,
      code: "ip_literal_forbidden",
      message: "Direct IP address literals are forbidden.",
    };
  }

  // Allowlist domain matching: exact or subdomain ending with '.' + domain
  const matchesDomain = ALLOWED_DOMAINS.some(
    (allowed) => hostname === allowed || hostname.endsWith("." + allowed)
  );

  if (!matchesDomain) {
    return {
      ok: false,
      code: "domain_not_allowlisted",
      message: `Domain '${hostname}' is not in the allowlist (${ALLOWED_DOMAINS.join(", ")}).`,
    };
  }

  return { ok: true, code: "valid", message: "Source URL is valid and allowlisted." };
}
