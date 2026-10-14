import fs from "fs";
import path from "path";
import crypto from "crypto";

const EXPECTED_SHA256 = "9380175f322387696259a522483239be209d58b8e21fd4928cadf4ab46702e0e";
const filePath = path.join(process.cwd(), "contracts-reference", "CommitmentLedger.py");

if (!fs.existsSync(filePath)) {
  console.error(`FAILED: Reference contract not found at ${filePath}`);
  process.exit(1);
}

const content = fs.readFileSync(filePath);
const actualSha256 = crypto.createHash("sha256").update(content).digest("hex");

if (actualSha256 !== EXPECTED_SHA256) {
  console.error(`FAILED: Reference contract SHA-256 mismatch!`);
  console.error(`  Expected: ${EXPECTED_SHA256}`);
  console.error(`  Actual:   ${actualSha256}`);
  process.exit(1);
}

console.log(`PASS: Reference contract matches canonical SHA-256 (${actualSha256}).`);
process.exit(0);
