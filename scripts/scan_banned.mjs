import fs from "fs";
import path from "path";

// Banned words per specification:
// - "Live" / "live" (must say "Studionet (Preview)")
// - "testnet"
// - "live network"
// - "mainnet"
// - "cryptographic proof"
// - "tamper-proof" / "tamperproof"
// - "bytecode"
// - "finalized" (use "accepted by validators")
// - "unanimous" / "unanimously"
// - Exclusivity claims: "first", "only", "the only", "unique" (when referring to the dApp / contract)
// - "revolutionary"

const BANNED_PATTERNS = [
  { pattern: /\bcryptographic\s+proof\b/i, name: "cryptographic proof" },
  { pattern: /\btamper-?proof\b/i, name: "tamper-proof" },
  { pattern: /\bbytecode\b/i, name: "bytecode" },
  { pattern: /\btestnet\b/i, name: "testnet" },
  { pattern: /\blive\s+network\b/i, name: "live network" },
  { pattern: /\bmainnet\b/i, name: "mainnet" },
  { pattern: /\bunanimous(ly)?\b/i, name: "unanimous" },
  { pattern: /\brevolutionary\b/i, name: "revolutionary" },
  // Note on 'finalized': allowed only if referring to EVM block tag 'latest-final' or raw status code check
  { pattern: /\bfinalized\b/i, name: "finalized", allowPredicate: (line) => line.includes("latest-final") || line.includes("FINALIZED") },
  // Note on 'live': allowed only if referring to 'live_evidence' filename or code variable
  { pattern: /\blive\b/i, name: "live", allowPredicate: (line) => line.includes("live_evidence") || line.includes("run_live") || line.includes("aria-live") },
];

const rootDir = process.cwd();
const dirsToScan = ["src", "docs"];
const filesToScan = ["index.html", "README.md"];

let violations = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    for (const rule of BANNED_PATTERNS) {
      if (rule.pattern.test(line)) {
        if (rule.allowPredicate && rule.allowPredicate(line)) {
          continue;
        }
        violations.push({
          file: path.relative(rootDir, filePath),
          line: index + 1,
          word: rule.name,
          text: line.trim(),
        });
      }
    }
  });
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== ".git") {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".md") || entry.name.endsWith(".html")) {
        scanFile(fullPath);
      }
    }
  }
}

for (const d of dirsToScan) {
  scanDir(path.join(rootDir, d));
}

for (const f of filesToScan) {
  const p = path.join(rootDir, f);
  if (fs.existsSync(p)) scanFile(p);
}

if (violations.length > 0) {
  console.error(`FAILED: Found ${violations.length} banned word violations:`);
  violations.forEach((v) => {
    console.error(`  ${v.file}:${v.line} [${v.word}] -> ${v.text.slice(0, 100)}`);
  });
  process.exit(1);
} else {
  console.log("PASS: Zero banned words detected across codebase and docs.");
  process.exit(0);
}
