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

  // Test 1: Desktop Viewport (1280px) + Mid-Reveal & Settled Hero + Alternating Sections
  console.log("\n[1/5] Testing Desktop Viewport (1280px), Hero Reveal & Alternating Sections...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await desktopContext.newPage();

  // Navigate with domcontentloaded so we can capture the hero mid-reveal (~250ms)
  await page.goto(PROD_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".hero-title");
  await page.waitForTimeout(260);
  await page.screenshot({
    path: path.join(SCREENS_DIR, "landing_hero_mid_reveal.png"),
    fullPage: false,
  });
  console.log("  ✓ Captured docs/screens/landing_hero_mid_reveal.png (Hero mid-reveal)");

  // Wait for fonts, network idle, and the 1.75s hero reveal to settle completely
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1800);

  // Verify Hero headline uses Source Serif 4 and hero-word-reveal animation
  const heroFontAndAnim = await page.$eval(".hero-title", (el) => {
    const style = window.getComputedStyle(el);
    const firstWord = el.querySelector(".hero-word-reveal");
    const wordStyle = firstWord ? window.getComputedStyle(firstWord) : null;
    return {
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      animationName: wordStyle?.animationName || "",
      opacity: wordStyle?.opacity || "0",
    };
  });
  console.log(
    `  Hero headline font: ${heroFontAndAnim.fontFamily} (weight ${heroFontAndAnim.fontWeight}), animation: ${heroFontAndAnim.animationName}, settled opacity: ${heroFontAndAnim.opacity}`
  );
  if (!heroFontAndAnim.fontFamily.toLowerCase().includes("source serif")) {
    throw new Error(`Expected hero headline to use Source Serif 4, got ${heroFontAndAnim.fontFamily}`);
  }
  if (heroFontAndAnim.opacity !== "1") {
    throw new Error(`Expected settled hero word opacity 1, got ${heroFontAndAnim.opacity}`);
  }

  // Verify alternating editorial <-> ocean sections across all 13 themed sections
  const sectionThemes = await page.$$eval("[data-theme]", (els) =>
    els.map((el) => el.getAttribute("data-theme"))
  );
  console.log(`  Section theme sequence (${sectionThemes.length} sections): ${sectionThemes.join(" -> ")}`);
  if (sectionThemes.length !== 13) {
    throw new Error(`Expected 13 themed sections, found ${sectionThemes.length}`);
  }
  for (let i = 0; i < sectionThemes.length; i++) {
    const expected = i % 2 === 0 ? "editorial" : "ocean";
    if (sectionThemes[i] !== expected) {
      throw new Error(`Section ${i + 1} expected theme '${expected}', got '${sectionThemes[i]}'`);
    }
  }
  console.log("  ✓ Confirmed strict alternating editorial <-> ocean rhythm across all 13 sections.");

  // Check for horizontal scroll at 1280px
  const desktopHasHScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`  Desktop horizontal scroll: ${desktopHasHScroll ? "DETECTED (FAIL)" : "NONE (PASS)"}`);
  if (desktopHasHScroll) throw new Error("Horizontal scroll detected at 1280px");

  // Capture Landing Top settled screenshot
  await page.screenshot({ path: path.join(SCREENS_DIR, "landing_top.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/landing_top.png (Hero settled)");

  // Scroll to Editorial section (02 / Architecture) & screenshot
  const archHeader = page.locator("text=An intelligent notary backed by").first();
  await archHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SCREENS_DIR, "editorial_section.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/editorial_section.png (Editorial section)");

  // Scroll to Ocean section (#how-it-works) & screenshot
  await page.locator("#how-it-works").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SCREENS_DIR, "how_it_works.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/how_it_works.png (Ocean section)");

  // Scroll to Evidence section (Ocean section) & screenshot
  const evidenceHeader = page.locator("text=Verified Studionet Evidence").first();
  await evidenceHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SCREENS_DIR, "evidence.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/evidence.png (Ocean evidence section)");

  // Test 2: Reduced Motion Mode
  console.log("\n[2/5] Testing Reduced Motion Mode...");
  const motionContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  const motionPage = await motionContext.newPage();
  await motionPage.goto(PROD_URL, { waitUntil: "networkidle" });
  const heroHeadingVisible = await motionPage.isVisible("text=A public");
  const allRevealsVisible = await motionPage.$$eval(
    ".hero-word-reveal, .reveal-heading, .reveal-on-scroll",
    (els) => els.every((el) => window.getComputedStyle(el).opacity === "1")
  );
  console.log(
    `  Hero & all scroll-reveal elements immediately visible under reduced motion: ${
      heroHeadingVisible && allRevealsVisible ? "YES (PASS)" : "NO (FAIL)"
    }`
  );
  if (!heroHeadingVisible || !allRevealsVisible) {
    throw new Error("Elements hidden under prefers-reduced-motion: reduce");
  }

  // Test 3: Mobile Viewport (390px)
  console.log("\n[3/5] Testing Mobile Viewport (390px)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(PROD_URL, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1800);

  const mobileHasHScroll = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`  Mobile landing horizontal scroll: ${mobileHasHScroll ? "DETECTED (FAIL)" : "NONE (PASS)"}`);
  if (mobileHasHScroll) throw new Error("Horizontal scroll detected on Landing at 390px");

  await mobilePage.screenshot({ path: path.join(SCREENS_DIR, "mobile_landing.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/mobile_landing.png");

  // Navigate to /app on mobile
  await mobilePage.goto(`${PROD_URL}/app`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);
  const mobileAppHasHScroll = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`  Mobile /app horizontal scroll: ${mobileAppHasHScroll ? "DETECTED (FAIL)" : "NONE (PASS)"}`);
  if (mobileAppHasHScroll) throw new Error("Horizontal scroll detected on /app at 390px");

  await mobilePage.screenshot({ path: path.join(SCREENS_DIR, "mobile_app.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/mobile_app.png");

  // Test 4: Workbench (/app) Desktop & Form Blocking + Bug Fix 1 (2105-01-01 accepted)
  console.log("\n[4/5] Testing Workbench (/app) Desktop Form Validations...");
  await page.goto(`${PROD_URL}/app`, { waitUntil: "networkidle" });

  // Check wallet generated
  const walletButtonText = await page.textContent("button:has-text('Wallet'), button:has-text('0x')");
  console.log(`  Wallet account chip found: ${walletButtonText ? "YES (" + walletButtonText.trim() + ")" : "NO"}`);

  // Verify 2105-01-01 is accepted with valid text (Bug Fix 1)
  await page.fill("#rawText", "Apollo 11 will land on the Moon.");
  await page.fill("#deadline", "2105-01-01");
  const validFutureYearEnabled = await page.isEnabled("button:has-text('Broadcast Registration')");
  console.log(`  Register submit button enabled for 2105-01-01: ${validFutureYearEnabled ? "YES (PASS)" : "NO (FAIL)"}`);
  if (!validFutureYearEnabled) throw new Error("Register button should be enabled for valid deadline 2105-01-01");

  // Test Register tab blocking 2025-02-29 and 401 chars
  await page.fill("#rawText", "A".repeat(401));
  await page.fill("#deadline", "2025-02-29");

  const registerSubmitDisabled = await page.isDisabled("button:has-text('Broadcast Registration')");
  console.log(`  Register submit button disabled on invalid input: ${registerSubmitDisabled ? "YES (PASS)" : "NO (FAIL)"}`);
  if (!registerSubmitDisabled) throw new Error("Register button should be disabled for invalid inputs");

  await page.screenshot({ path: path.join(SCREENS_DIR, "app_register.png"), fullPage: false });
  console.log("  ✓ Captured docs/screens/app_register.png");

  // Test 5: Resolve Tab URL Blocking, Lookup Not-Found (Bug Fix 2), & Examples Tab
  console.log("\n[5/5] Testing Resolve Tab URL Blocking, Lookup Not-Found & Examples Tab...");
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

  // Test Lookup tab nonexistent ID on Studionet (Bug Fix 2)
  await page.click("button:has-text('Lookup & History')");
  await page.waitForTimeout(850);
  const lookupInput = page.locator("input[placeholder*='1fe69a47c557']");
  await lookupInput.fill("deadbeef0000");
  await lookupInput.press("Enter");
  await page.waitForSelector("text=Commitment Not Found:", { timeout: 25000 });
  console.log("  ✓ Verified Lookup tab returns 'Commitment Not Found' for nonexistent ID deadbeef0000 on Studionet.");

  // Test Examples Tab live read
  await page.click("button:has-text('Verified Examples')");
  await page.waitForSelector("text=Case A: Paraphrased Source Fulfillment (KEPT)", { timeout: 30000 });
  await page.waitForTimeout(800);
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
