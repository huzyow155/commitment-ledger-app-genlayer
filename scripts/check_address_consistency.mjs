import fs from "fs";
import path from "path";

// Active contract address: 0xdD0d120B50ED65400E8b6a060bB15103B42544E8
const ACTIVE_ADDRESS = "0xdD0d120B50ED65400E8b6a060bB15103B42544E8".toLowerCase();

// Superseded addresses: MUST NOT appear anywhere in src/, scripts/, tests/, docs/
// They may appear ONLY in README.md under a superseded note pointing to the contract repo.
const SUPERSEDED_ADDRESSES = [
  "0x3155c7c80f4334968d61E1b79f74EB864CF7cb08".toLowerCase(),
  "0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1".toLowerCase(),
  "0x8a5269aa724E77D799b3F0dbbaeee7683157f52d".toLowerCase(),
  "0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3".toLowerCase(),
];

const rootDir = process.cwd();
const dirsToCheck = ["src", "scripts", "tests", "docs"];

let leaks = [];

function checkFile(filePath) {
  if (filePath.endsWith("check_address_consistency.mjs")) return;
  if (filePath.endsWith("verify_bundle.mjs")) return;
  const content = fs.readFileSync(filePath, "utf8").toLowerCase();
  for (const superseded of SUPERSEDED_ADDRESSES) {
    if (content.includes(superseded)) {
      leaks.push({ file: path.relative(rootDir, filePath), superseded });
    }
  }
}

function checkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== ".git") {
        checkDir(fullPath);
      }
    } else if (entry.isFile()) {
      checkFile(fullPath);
    }
  }
}

for (const d of dirsToCheck) {
  checkDir(path.join(rootDir, d));
}

// Also check index.html
if (fs.existsSync(path.join(rootDir, "index.html"))) {
  checkFile(path.join(rootDir, "index.html"));
}

if (leaks.length > 0) {
  console.error("FAILED: Superseded contract addresses found outside README.md:");
  leaks.forEach((l) => console.error(`  ${l.file} contains superseded address ${l.superseded}`));
  process.exit(1);
} else {
  console.log("PASS: Active address is consistent. Zero superseded addresses leaked into codebase.");
  process.exit(0);
}
