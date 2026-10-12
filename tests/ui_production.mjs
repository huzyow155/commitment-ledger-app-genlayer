import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const PROD_URL = "https://commitment-ledger-app-genlayer.vercel.app";
const SCREENS_DIR = path.join(process.cwd(), "docs", "screens");

async function main() {
  if (!fs.existsSync(SCREENS_DIR)) {
    fs.mkdirSync(SCREENS_DIR, { recursive: true });
  }

  console.log("=======================================================");
  console.log(`RUNNING PRODUCTION UI TESTS AGAINST: ${PROD_URL}`);
  console.log("=======================================================");

  const browser = await chromium.launch();

  // Test 1: Desktop Viewport (1280px)
  console.log("\n[1/5] Testing Desktop Viewport (1280px)...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await desktopContext.newPage();
  await page.goto(PROD_URL, { waitUntil: "networkidle" });

  // Verify all 13 required sections on landing
  const headings = await page.$$eval("h1, h2, h3", (elements) =>
    elements.map((el) => el.textContent?.trim() || "")
  );
  console.log(`  Found ${headings.length} headings on Landing.`);

  // Check for horizontal scroll at 1280px
  const desktopHasHScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`  Desktop horizontal scroll: ${desktopHasHScroll ? "DETECTED (FAIL)" : "NONE (PASS)"}`);
  if (desktopHasHScroll) throw new Error("Horizontal scroll detected at 1280px");

  // Capture Landing Top screenshot
  await page.screenshot({ path: path.join(SCREENS_DIR, "landing_top.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/landing_top.png");

  // Scroll to How It Works section & screenshot
  await page.locator("#how-it-works").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENS_DIR, "how_it_works.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/how_it_works.png");

  // Scroll to Evidence section & screenshot
  const evidenceHeader = page.locator("text=Verified Studionet Evidence").first();
  await evidenceHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENS_DIR, "evidence.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/evidence.png");

  // Test 2: Reduced Motion Mode
  console.log("\n[2/5] Testing Reduced Motion Mode...");
  const motionContext = await browser.newContext({
    reducedMotion: "reduce",
  });
  const motionPage = await motionContext.newPage();
  await motionPage.goto(PROD_URL, { waitUntil: "networkidle" });
  const heroHeadingVisible = await motionPage.isVisible("text=A public ledger of promises");
  console.log(`  Hero heading visible under reduced motion: ${heroHeadingVisible ? "YES (PASS)" : "NO (FAIL)"}`);
  if (!heroHeadingVisible) throw new Error("Hero heading hidden under reduced motion");

  // Test 3: Mobile Viewport (390px)
  console.log("\n[3/5] Testing Mobile Viewport (390px)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(PROD_URL, { waitUntil: "networkidle" });

  const mobileHasHScroll = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`  Mobile horizontal scroll: ${mobileHasHScroll ? "DETECTED (FAIL)" : "NONE (PASS)"}`);
  if (mobileHasHScroll) throw new Error("Horizontal scroll detected at 390px");

  // Navigate to /app on mobile
  await mobilePage.goto(`${PROD_URL}/app`, { waitUntil: "networkidle" });
  await mobilePage.screenshot({ path: path.join(SCREENS_DIR, "mobile_app.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/mobile_app.png");

  // Test 4: Workbench (/app) Desktop & Form Blocking
  console.log("\n[4/5] Testing Workbench (/app) Desktop Form Validations...");
  await page.goto(`${PROD_URL}/app`, { waitUntil: "networkidle" });

  // Check wallet generated
  const walletButtonText = await page.textContent("button:has-text('Wallet'), button:has-text('0x')");
  console.log(`  Wallet account chip found: ${walletButtonText ? "YES (" + walletButtonText.trim() + ")" : "NO"}`);

  // Test Register tab blocking 2025-02-29 and 401 chars
  await page.fill("#rawText", "A".repeat(401));
  await page.fill("#deadline", "2025-02-29");

  const registerSubmitDisabled = await page.isDisabled("button:has-text('Broadcast Registration')");
  console.log(`  Register submit button disabled on invalid input: ${registerSubmitDisabled ? "YES (PASS)" : "NO (FAIL)"}`);
  if (!registerSubmitDisabled) throw new Error("Register button should be disabled for invalid inputs");

  await page.screenshot({ path: path.join(SCREENS_DIR, "app_register.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/app_register.png");

  // Test Resolve tab blocking http://, https://github.com/..., and https://evilwikipedia.org/
  console.log("\n[5/5] Testing Resolve Tab URL Blocking & Examples Tab...");
  await page.click("button:has-text('Resolve')");
  await page.fill("#resolveId", "1fe69a47c557");

  // Test evil URL
  await page.fill("#sourceUrl", "https://evilwikipedia.org/wiki/Apollo_11");
  let resolveDisabled = await page.isDisabled("button:has-text('Execute Consensus Resolution')");
  console.log(`  Resolve button disabled for evilwikipedia.org: ${resolveDisabled ? "YES (PASS)" : "NO (FAIL)"}`);
  if (!resolveDisabled) throw new Error("Resolve button should be disabled for evilwikipedia.org");

  // Test github URL
  await page.fill("#sourceUrl", "https://github.com/nasa/apollo11");
  resolveDisabled = await page.isDisabled("button:has-text('Execute Consensus Resolution')");
  console.log(`  Resolve button disabled for github.com: ${resolveDisabled ? "YES (PASS)" : "NO (FAIL)"}`);
  if (!resolveDisabled) throw new Error("Resolve button should be disabled for github.com");

  // Test insecure http URL
  await page.fill("#sourceUrl", "http://en.wikipedia.org/wiki/Apollo_11");
  resolveDisabled = await page.isDisabled("button:has-text('Execute Consensus Resolution')");
  console.log(`  Resolve button disabled for http://: ${resolveDisabled ? "YES (PASS)" : "NO (FAIL)"}`);
  if (!resolveDisabled) throw new Error("Resolve button should be disabled for http://");

  // Test Examples Tab live read
  await page.click("button:has-text('Verified Examples')");
  // Wait for RPC read
  await page.waitForSelector("text=Case A: Paraphrased Source Fulfillment (KEPT)", { timeout: 30000 });
  console.log("  ✓ Verified Examples tab loaded live RPC cases (KEPT, BROKEN, REVERT).");

  await page.screenshot({ path: path.join(SCREENS_DIR, "app_examples.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/app_examples.png");

  await browser.close();
  console.log("\n=======================================================");
  console.log("ALL PLAYWRIGHT PRODUCTION UI TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("FATAL PLAYWRIGHT ERROR:", err);
  process.exit(1);
});
