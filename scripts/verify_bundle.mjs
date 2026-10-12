import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const distAssetsDir = path.join(rootDir, "dist", "assets");

if (!fs.existsSync(distAssetsDir)) {
  console.error("FAILED: dist/assets directory not found. Please run npm run build first.");
  process.exit(1);
}

const ACTIVE_ADDRESS = "0x3155c7c80f4334968d61E1b79f74EB864CF7cb08".toLowerCase();
const SUPERSEDED_ADDRESSES = [
  "0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1".toLowerCase(),
  "0x8a5269aa724E77D799b3F0dbbaeee7683157f52d".toLowerCase(),
  "0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3".toLowerCase(),
];

const jsFiles = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith(".js"));

let hasActiveAddress = false;
let foundSuperseded = [];

for (const file of jsFiles) {
  const content = fs.readFileSync(path.join(distAssetsDir, file), "utf8").toLowerCase();
  if (content.includes(ACTIVE_ADDRESS)) {
    hasActiveAddress = true;
  }
  for (const s of SUPERSEDED_ADDRESSES) {
    if (content.includes(s)) {
      foundSuperseded.push({ file, s });
    }
  }
}

console.log(`Audited ${jsFiles.length} production bundle assets.`);
console.log(`Active address present: ${hasActiveAddress ? "YES" : "NO"}`);

if (!hasActiveAddress) {
  console.error("FAILED: Active contract address not found in production bundle.");
  process.exit(1);
}

if (foundSuperseded.length > 0) {
  console.error("FAILED: Superseded contract address found in bundle assets:", foundSuperseded);
  process.exit(1);
}

console.log("PASS: Bundle verified successfully. Only active address present.");
process.exit(0);
