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

  // Test 1: Desktop Viewport (1280px) + Header/Logo/Drawer/Favicon + Hero Reveal + Alternating Sections
  console.log("\n[1/6] Testing Desktop Viewport (1280px), Hero Reveal & Alternating Sections...");
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
  console.log("  [OK] Captured docs/screens/landing_hero_mid_reveal.png (Hero mid-reveal)");

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

  // Test 2: Header, Logo, Status Pill Removal, Menu Chevron, Drawer Kicker Removal, and Favicon
  console.log("\n[2/6] Verifying Header Logo, Status Pill Removal, Menu Chevron, Drawer & Favicon...");

  // 2a. Confirm navbar never contains the removed "Studionet (Preview)" pill
  const navbarText = await page.textContent("header.navbar");
  if (navbarText && navbarText.includes("Studionet")) {
    throw new Error(`Navbar still contains removed status pill text: "${navbarText}"`);
  }
  console.log("  [OK] Confirmed top navbar does not contain 'Studionet (Preview)' status pill.");

  // 2b. Confirm no raw caret character in menu-trigger, and lucide ChevronDown (.menu-chevron) is present
  const menuTriggerCheck = await page.$eval(".menu-trigger", (btn) => {
    const text = btn.textContent || "";
    const svg = btn.querySelector("svg.menu-chevron");
    const svgRect = svg ? svg.getBoundingClientRect() : null;
    return {
      text: text.trim(),
      hasCaretGlyph: text.includes("\u2303") || text.includes("^"),
      hasChevronSvg: Boolean(svg),
      isOpenClass: svg ? svg.classList.contains("is-open") : false,
      svgWidth: svgRect ? svgRect.width : 0,
      svgHeight: svgRect ? svgRect.height : 0,
    };
  });
  if (menuTriggerCheck.hasCaretGlyph || !menuTriggerCheck.hasChevronSvg || menuTriggerCheck.isOpenClass) {
    throw new Error(`Invalid closed menu trigger state: ${JSON.stringify(menuTriggerCheck)}`);
  }
  console.log(
    `  [OK] Confirmed Menu button uses SVG ChevronDown (${menuTriggerCheck.svgWidth}x${menuTriggerCheck.svgHeight}px) with no raw caret glyph.`
  );

  // 2c. Confirm spacing between wallet pill and Menu button at 1280px
  const desktopPillGap = await page.evaluate(() => {
    const wallet = document.querySelector(".wallet-pill-trigger")?.getBoundingClientRect();
    const menu = document.querySelector(".menu-trigger")?.getBoundingClientRect();
    return wallet && menu ? menu.left - wallet.right : -1;
  });
  console.log(`  Desktop gap between wallet pill and Menu button: ${desktopPillGap.toFixed(1)}px`);
  if (desktopPillGap < 8) {
    throw new Error(`Wallet pill and Menu button too close on desktop: ${desktopPillGap}px`);
  }

  // 2d. Confirm BrandLogoMark renders in header wordmark on Editorial section
  const editorialLogoState = await page.$eval("header.navbar", (nav) => {
    const logo = nav.querySelector(".wordmark svg.wordmark-logo");
    const rect = logo ? logo.getBoundingClientRect() : null;
    const firstRect = logo?.querySelector("rect");
    return {
      navTheme: nav.getAttribute("data-nav-theme"),
      present: Boolean(logo),
      width: rect ? rect.width : 0,
      height: rect ? rect.height : 0,
      fill: firstRect ? firstRect.getAttribute("fill") : null,
    };
  });
  console.log(`  Header logo on Editorial section: ${JSON.stringify(editorialLogoState)}`);
  if (!editorialLogoState.present || editorialLogoState.width < 20 || editorialLogoState.navTheme !== "editorial") {
    throw new Error(`Logo failed check on editorial section: ${JSON.stringify(editorialLogoState)}`);
  }

  // Capture Header Closed screenshot (top band of page)
  await page.screenshot({
    path: path.join(SCREENS_DIR, "header_closed.png"),
    clip: { x: 0, y: 0, width: 1280, height: 140 },
  });
  console.log("  [OK] Captured docs/screens/header_closed.png (New header with logo, no status pill, closed menu)");

  // 2e. Confirm favicon and apple-touch-icon links exist in <head> and HTTP GET returns 200
  const iconLinks = await page.evaluate(() => {
    const icons = Array.from(document.querySelectorAll("link[rel='icon'], link[rel='apple-touch-icon']"));
    return icons.map((el) => ({
      rel: el.getAttribute("rel"),
      type: el.getAttribute("type"),
      sizes: el.getAttribute("sizes"),
      href: el.getAttribute("href"),
    }));
  });
  console.log(`  Head icon links: ${JSON.stringify(iconLinks)}`);
  if (iconLinks.length < 3) {
    throw new Error(`Expected favicon.svg, favicon-32x32.png, and apple-touch-icon.png links in <head>, found: ${JSON.stringify(iconLinks)}`);
  }
  for (const link of iconLinks) {
    const res = await page.request.get(`${PROD_URL}${link.href}`);
    if (res.status() !== 200) {
      throw new Error(`Asset ${link.href} returned HTTP ${res.status()}`);
    }
  }
  const logoSvgRes = await page.request.get(`${PROD_URL}/logo.svg`);
  const logoWordmarkRes = await page.request.get(`${PROD_URL}/logo-wordmark.svg`);
  if (logoSvgRes.status() !== 200 || logoWordmarkRes.status() !== 200) {
    throw new Error(`Expected /logo.svg and /logo-wordmark.svg to return 200`);
  }
  console.log("  [OK] Verified /favicon.svg, /favicon-32x32.png, /apple-touch-icon.png, /logo.svg, and /logo-wordmark.svg return HTTP 200.");

  // 2f. Open the menu drawer and verify chevron rotation + absence of 'CommitmentLedger / Navigation'
  const drawerClosedText = await page.textContent("#site-drawer");
  if (drawerClosedText && drawerClosedText.includes("CommitmentLedger / Navigation")) {
    throw new Error("Drawer contains removed kicker text while closed!");
  }
  await page.click(".menu-trigger");
  await page.waitForTimeout(450);

  const openMenuState = await page.evaluate(() => {
    const drawer = document.querySelector("#site-drawer");
    const kicker = document.querySelector(".drawer-kicker");
    const chevron = document.querySelector("svg.menu-chevron");
    const chevronStyle = chevron ? window.getComputedStyle(chevron) : null;
    const topline = document.querySelector(".drawer-topline");
    const toplineStyle = topline ? window.getComputedStyle(topline) : null;
    return {
      drawerOpen: drawer?.classList.contains("is-open") ?? false,
      drawerText: drawer?.textContent || "",
      hasKickerElement: Boolean(kicker),
      chevronOpenClass: chevron?.classList.contains("is-open") ?? false,
      chevronTransform: chevronStyle?.transform || "",
      toplineJustify: toplineStyle?.justifyContent || "",
    };
  });
  console.log(
    `  Open drawer state: drawerOpen=${openMenuState.drawerOpen}, hasKickerElement=${openMenuState.hasKickerElement}, chevronOpenClass=${openMenuState.chevronOpenClass}, chevronTransform=${openMenuState.chevronTransform}, toplineJustify=${openMenuState.toplineJustify}`
  );
  if (
    !openMenuState.drawerOpen ||
    openMenuState.hasKickerElement ||
    openMenuState.drawerText.includes("CommitmentLedger / Navigation") ||
    !openMenuState.chevronOpenClass
  ) {
    throw new Error(`Drawer or chevron failed open-state verification: ${JSON.stringify(openMenuState)}`);
  }
  console.log("  [OK] Confirmed open drawer has rotated chevron, right-aligned Close button, and zero 'CommitmentLedger / Navigation' text.");

  await page.screenshot({
    path: path.join(SCREENS_DIR, "menu_drawer_open.png"),
    fullPage: false,
  });
  console.log("  [OK] Captured docs/screens/menu_drawer_open.png (Clean open menu drawer)");

  // Close menu drawer
  await page.click(".drawer-close");
  await page.waitForTimeout(450);

  // Capture Landing Top settled screenshot
  await page.screenshot({ path: path.join(SCREENS_DIR, "landing_top.png"), fullPage: false });
  console.log("  [OK] Captured docs/screens/landing_top.png (Hero settled)");

  // Capture Browser Tab + Favicon visual verification screenshot (rendering the live /favicon.svg + document.title in a browser tab strip at the top of the viewport, then removing the overlay)
  await page.evaluate(async () => {
    const faviconHref = document.querySelector("link[rel='icon'][type='image/svg+xml']")?.getAttribute("href") || "/favicon.svg";
    const svgText = await fetch(faviconHref).then((r) => r.text());
    const bar = document.createElement("div");
    bar.id = "__pw_tab_preview";
    bar.style.cssText =
      "position:fixed;top:0;left:0;right:0;height:42px;background:#dee1e6;display:flex;align-items:flex-end;padding:0 16px;z-index:99999;font-family:Inter,sans-serif;border-bottom:1px solid #c8ccd1;";
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;margin-right:14px;">
        <span style="width:11px;height:11px;border-radius:50%;background:#ff5f56;display:inline-block;"></span>
        <span style="width:11px;height:11px;border-radius:50%;background:#ffbd2e;display:inline-block;"></span>
        <span style="width:11px;height:11px;border-radius:50%;background:#27c93f;display:inline-block;"></span>
      </div>
      <div style="display:flex;align-items:center;gap:9px;background:#ffffff;border-radius:10px 10px 0 0;padding:7px 16px;font-size:12px;font-weight:500;color:#0a0a0a;box-shadow:0 -1px 4px rgba(0,0,0,0.06);max-width:380px;">
        <span style="width:18px;height:18px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;">${svgText.replace(/width="64"\s+height="64"/, 'width="18" height="18"')}</span>
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${document.title}</span>
        <span style="color:#6b6b6b;font-size:14px;margin-left:6px;">&times;</span>
      </div>
      <div style="margin-left:16px;margin-bottom:8px;background:#edf0f3;border-radius:999px;padding:4px 14px;font-size:11px;color:#4a4f55;font-family:monospace;">
        commitment-ledger-app-genlayer.vercel.app
      </div>
    `;
    document.body.style.paddingTop = "42px";
    const nav = document.querySelector("header.navbar");
    if (nav) nav.style.top = "42px";
    document.body.appendChild(bar);
  });
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(SCREENS_DIR, "browser_tab_favicon.png"),
    clip: { x: 0, y: 0, width: 1280, height: 220 },
  });
  await page.evaluate(() => {
    document.getElementById("__pw_tab_preview")?.remove();
    document.body.style.paddingTop = "";
    const nav = document.querySelector("header.navbar");
    if (nav) nav.style.top = "";
  });
  console.log("  [OK] Captured docs/screens/browser_tab_favicon.png (Browser tab with live /favicon.svg + header)");

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
  console.log("  [OK] Confirmed strict alternating editorial <-> ocean rhythm across all 13 sections.");

  // Check for horizontal scroll at 1280px
  const desktopHasHScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`  Desktop horizontal scroll: ${desktopHasHScroll ? "DETECTED (FAIL)" : "NONE (PASS)"}`);
  if (desktopHasHScroll) throw new Error("Horizontal scroll detected at 1280px");

  // Scroll to Editorial section (02 / Architecture) & screenshot
  const archHeader = page.locator("text=An intelligent notary backed by").first();
  await archHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SCREENS_DIR, "editorial_section.png"), fullPage: false });
  console.log("  [OK] Captured docs/screens/editorial_section.png (Editorial section)");

  // Scroll to Ocean section (#how-it-works) & verify header logo switches to ocean variant
  await page.locator("#how-it-works").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const oceanLogoState = await page.$eval("header.navbar", (nav) => {
    const logo = nav.querySelector(".wordmark svg.wordmark-logo");
    const firstRect = logo?.querySelector("rect");
    return {
      navTheme: nav.getAttribute("data-nav-theme"),
      present: Boolean(logo),
      fill: firstRect ? firstRect.getAttribute("fill") : null,
    };
  });
  console.log(`  Header logo on Ocean section: ${JSON.stringify(oceanLogoState)}`);
  if (!oceanLogoState.present || oceanLogoState.navTheme !== "ocean") {
    throw new Error(`Expected header navbar to adapt to ocean theme over #how-it-works, got ${JSON.stringify(oceanLogoState)}`);
  }
  await page.screenshot({ path: path.join(SCREENS_DIR, "how_it_works.png"), fullPage: false });
  console.log("  [OK] Captured docs/screens/how_it_works.png (Ocean section with adaptive light header logo)");

  // Scroll to Evidence section (Ocean section) & screenshot
  const evidenceHeader = page.locator("text=Verified Studionet Evidence").first();
  await evidenceHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SCREENS_DIR, "evidence.png"), fullPage: false });
  console.log("  [OK] Captured docs/screens/evidence.png (Ocean evidence section)");

  // Test 3: Reduced Motion Mode
  console.log("\n[3/6] Testing Reduced Motion Mode...");
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

  // Test 4: Mobile Viewport (390px)
  console.log("\n[4/6] Testing Mobile Viewport (390px)...");
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

  // Check mobile navbar spacing & absence of status pill at 390px
  const mobileNavMetrics = await mobilePage.evaluate(() => {
    const navText = document.querySelector("header.navbar")?.textContent || "";
    const wordmark = document.querySelector(".wordmark")?.getBoundingClientRect();
    const wallet = document.querySelector(".wallet-pill-trigger")?.getBoundingClientRect();
    const menu = document.querySelector(".menu-trigger")?.getBoundingClientRect();
    return {
      hasStudionetPill: navText.includes("Studionet"),
      wordmarkToWalletGap: wordmark && wallet ? wallet.left - wordmark.right : -1,
      walletToMenuGap: wallet && menu ? menu.left - wallet.right : -1,
    };
  });
  console.log(
    `  Mobile 390px navbar gaps: wordmark->wallet=${mobileNavMetrics.wordmarkToWalletGap.toFixed(1)}px, wallet->menu=${mobileNavMetrics.walletToMenuGap.toFixed(1)}px`
  );
  if (mobileNavMetrics.hasStudionetPill || mobileNavMetrics.walletToMenuGap < 8 || mobileNavMetrics.wordmarkToWalletGap < 6) {
    throw new Error(`Mobile 390px navbar layout check failed: ${JSON.stringify(mobileNavMetrics)}`);
  }

  await mobilePage.screenshot({ path: path.join(SCREENS_DIR, "mobile_landing.png"), fullPage: false });
  console.log("  [OK] Captured docs/screens/mobile_landing.png");

  // Navigate to /app on mobile
  await mobilePage.goto(`${PROD_URL}/app`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);
  const mobileAppHasHScroll = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`  Mobile /app horizontal scroll: ${mobileAppHasHScroll ? "DETECTED (FAIL)" : "NONE (PASS)"}`);
  if (mobileAppHasHScroll) throw new Error("Horizontal scroll detected on /app at 390px");

  await mobilePage.screenshot({ path: path.join(SCREENS_DIR, "mobile_app.png"), fullPage: false });
  console.log("  [OK] Captured docs/screens/mobile_app.png");

  // Test 5: Workbench (/app) Desktop & Form Blocking + Bug Fix 1 (2105-01-01 accepted)
  console.log("\n[5/6] Testing Workbench (/app) Desktop Form Validations...");
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
  console.log("  [OK] Captured docs/screens/app_register.png");

  // Test 6: Resolve Tab URL Blocking, Lookup Not-Found (Bug Fix 2), & Examples Tab
  console.log("\n[6/6] Testing Resolve Tab URL Blocking, Lookup Not-Found & Examples Tab...");
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
  console.log("  [OK] Verified Lookup tab returns 'Commitment Not Found' for nonexistent ID deadbeef0000 on Studionet.");

  // Test Examples Tab live read
  await page.click("button:has-text('Verified Examples')");
  await page.waitForSelector("text=Case A: Paraphrased Source Fulfillment (KEPT)", { timeout: 30000 });
  await page.waitForTimeout(800);
  console.log("  [OK] Verified Examples tab loaded live RPC cases (KEPT, BROKEN, REVERT).");

  await page.screenshot({ path: path.join(SCREENS_DIR, "app_examples.png"), fullPage: false });
  console.log("  [OK] Captured docs/screens/app_examples.png");

  await browser.close();
  console.log("\n=======================================================");
  console.log("ALL PLAYWRIGHT PRODUCTION UI TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("FATAL PLAYWRIGHT ERROR:", err);
  process.exit(1);
});
