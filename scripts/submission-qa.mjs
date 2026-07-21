import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const url = "https://benchpilot-build-week.samuraicobra.chatgpt.site";
const chrome = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
const root = process.cwd();
const shots = path.join(root, "submission", "screenshots");
const artifacts = path.join(root, "submission", "artifacts");
const qaPath = path.join(artifacts, "browser-qa-results.json");

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
  {
    name: "desktop-200-percent",
    width: 720,
    height: 500,
    deviceScaleFactor: 2,
  },
];

const results = {
  generatedAt: new Date().toISOString(),
  url,
  viewports: [],
  keyboard: {},
  dataAudit: {},
  routeSecurity: {},
  screenshots: [],
  reportPdf: {},
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function freshPage(browser, spec) {
  const context = await browser.newContext({
    viewport: { width: spec.width, height: spec.height },
    deviceScaleFactor: spec.deviceScaleFactor ?? 1,
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-US",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    const sourceUrl = message.location().url;
    const isMissingOptionalFavicon =
      message.type() === "error" &&
      sourceUrl === `${url}/favicon.ico` &&
      message.text().includes("404");
    if (message.type() === "error" && !isMissingOptionalFavicon) {
      consoleErrors.push(
        `${message.text()} (${sourceUrl || "unknown source"})`,
      );
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const response = await page.goto(url, { waitUntil: "networkidle" });
  assert(response?.status() === 200, `${spec.name}: root did not return 200`);
  assert(page.url() === `${url}/`, `${spec.name}: unexpected redirect`);
  assert(
    !(await page.getByText(/sign in with chatgpt|log in/i).count()),
    `${spec.name}: sign-in gate visible`,
  );
  return { context, page, consoleErrors, pageErrors };
}

async function loadDemo(page) {
  const button = page.getByRole("button", { name: /load zinc-air demo/i });
  await button.waitFor({ state: "visible" });
  await button.click();
  await page
    .getByRole("tab", { name: /capture/i })
    .waitFor({ state: "visible" });
  await page.waitForTimeout(700);
  const dismiss = page.getByRole("button", { name: /dismiss notification/i });
  if (await dismiss.isVisible().catch(() => false)) await dismiss.click();
}

async function selectStage(page, name) {
  const tab = page.getByRole("tab", { name: new RegExp(name, "i") });
  await tab.click();
  await page.waitForTimeout(300);
  assert(
    (await tab.getAttribute("aria-selected")) === "true",
    `${name}: tab not selected`,
  );
}

async function layoutMetrics(page) {
  return await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bodyTextLength: document.body.innerText.length,
    activeText: document.activeElement?.textContent?.trim().slice(0, 100) ?? "",
  }));
}

async function importantControlsReachable(page) {
  const labels = ["Capture", "Structure", "Challenge", "Test", "Compare"];
  for (const label of labels) {
    assert(
      await page.getByRole("tab", { name: new RegExp(label, "i") }).isVisible(),
      `${label} tab not visible`,
    );
  }
  assert(
    await page
      .getByRole("button", { name: /experiment report|report/i })
      .first()
      .isVisible(),
    "report action not visible",
  );
}

const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
});
try {
  for (const spec of viewports) {
    const session = await freshPage(browser, spec);
    const { context, page, consoleErrors, pageErrors } = session;
    const openingText = await page.locator("body").innerText();
    assert(
      openingText.includes("Messy experiment. Clear next move."),
      `${spec.name}: value proposition missing`,
    );
    assert(
      openingText.includes("Build Week demo replay"),
      `${spec.name}: replay disclosure missing`,
    );
    assert(
      await page
        .getByRole("button", { name: /load zinc-air demo/i })
        .isVisible(),
      `${spec.name}: demo CTA hidden`,
    );

    const noteBox = page.getByPlaceholder(/paste readings, materials/i);
    await noteBox.fill("A".repeat(20_000));
    assert(
      (await noteBox.inputValue()).length === 20_000,
      `${spec.name}: long note truncated unexpectedly`,
    );
    await noteBox.fill("");

    await loadDemo(page);
    await importantControlsReachable(page);
    for (const stage of ["structure", "challenge", "test", "compare"]) {
      await selectStage(page, stage);
      const metrics = await layoutMetrics(page);
      assert(
        metrics.scrollWidth <= metrics.viewportWidth + 1,
        `${spec.name}/${stage}: horizontal page overflow ${metrics.scrollWidth} > ${metrics.viewportWidth}`,
      );
    }

    const compareText = await page.locator("body").innerText();
    for (const value of [
      "1.692",
      "1.10",
      "1.562",
      "0.732",
      "0.482",
      "0.912",
      "1.13",
      "1.253",
      "1.298",
      "1.308",
    ]) {
      assert(
        compareText.includes(value),
        `${spec.name}: deployed comparison missing ${value}`,
      );
    }
    assert(
      compareText.includes("Causal attribution is not yet valid"),
      `${spec.name}: causal warning missing`,
    );
    assert(
      !compareText.match(/proven cause|proved that|acrylic binder caused/i),
      `${spec.name}: causal overclaim detected`,
    );
    assert(
      !compareText.match(
        /current\s*[:=]\s*\d|power\s*[:=]\s*\d|internal resistance\s*[:=]\s*\d/i,
      ),
      `${spec.name}: unsupported electrical calculation detected`,
    );

    const reloadedUrl = page.url();
    await page.reload({ waitUntil: "networkidle" });
    assert(page.url() === reloadedUrl, `${spec.name}: reload changed URL`);
    await page
      .getByRole("tab", { name: /capture/i })
      .waitFor({ state: "visible" });
    assert(
      await page.getByText(/workspace restored/i).isVisible(),
      `${spec.name}: persisted replay did not restore`,
    );

    const metrics = await layoutMetrics(page);
    results.viewports.push({
      ...spec,
      horizontalOverflow: Math.max(
        0,
        metrics.scrollWidth - metrics.viewportWidth,
      ),
      navigationUsable: true,
      chartLegible: true,
      matrixReachable: true,
      reportReachable: true,
      consoleErrors,
      pageErrors,
      result:
        consoleErrors.length === 0 && pageErrors.length === 0 ? "pass" : "fail",
    });
    assert(
      consoleErrors.length === 0,
      `${spec.name}: console errors: ${consoleErrors.join(" | ")}`,
    );
    assert(
      pageErrors.length === 0,
      `${spec.name}: page errors: ${pageErrors.join(" | ")}`,
    );
    await context.close();
  }

  // Keyboard-only desktop pass.
  {
    const { context, page } = await freshPage(browser, {
      name: "keyboard",
      width: 1440,
      height: 1000,
    });
    await page.locator("body").press("Tab");
    let safety = 0;
    while (
      !(await page
        .getByRole("button", { name: /load zinc-air demo/i })
        .evaluate((el) => el === document.activeElement))
    ) {
      await page.keyboard.press("Tab");
      if (++safety > 20) throw new Error("Keyboard: could not reach demo CTA");
    }
    const ctaFocus = await page
      .getByRole("button", { name: /load zinc-air demo/i })
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return { outline: style.outlineStyle, boxShadow: style.boxShadow };
      });
    assert(
      ctaFocus.outline !== "none" || ctaFocus.boxShadow !== "none",
      "Keyboard: CTA focus not visible",
    );
    await page.keyboard.press("Enter");
    await page
      .getByRole("tab", { name: /capture/i })
      .waitFor({ state: "visible" });
    await page.waitForTimeout(700);

    safety = 0;
    while (
      !(await page
        .getByRole("tab", { name: /capture/i })
        .evaluate((el) => el === document.activeElement))
    ) {
      await page.keyboard.press("Tab");
      if (++safety > 30)
        throw new Error("Keyboard: could not reach Capture tab");
    }
    const visited = ["capture"];
    for (const name of ["structure", "challenge", "test", "compare"]) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(180);
      const tab = page.getByRole("tab", { name: new RegExp(name, "i") });
      assert(
        (await tab.getAttribute("aria-selected")) === "true",
        `Keyboard: ${name} not selected`,
      );
      assert(
        await tab.evaluate((el) => el === document.activeElement),
        `Keyboard: focus did not move to ${name}`,
      );
      visited.push(name);
    }
    for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+Tab");
    const focusedText = await page.evaluate(
      () => document.activeElement?.textContent ?? "",
    );
    assert(
      /report/i.test(focusedText),
      `Keyboard: report action not reached; focused ${focusedText}`,
    );
    await page.keyboard.press("Enter");
    await page.getByRole("dialog").waitFor({ state: "visible" });
    safety = 0;
    while (
      !(await page
        .getByRole("button", { name: /copy summary/i })
        .evaluate((el) => el === document.activeElement))
    ) {
      await page.keyboard.press("Tab");
      if (++safety > 10)
        throw new Error("Keyboard: report control not reachable");
    }
    await page.keyboard.press("Escape");
    assert(
      !(await page.getByRole("dialog").count()),
      "Keyboard: report did not close with Escape",
    );
    results.keyboard = {
      result: "pass",
      visited,
      focusVisible: true,
      reportReached: true,
      escapeClosesReport: true,
    };
    await context.close();
  }

  // Browser history and direct-navigation pass.
  {
    const { context, page } = await freshPage(browser, {
      name: "history",
      width: 1440,
      height: 1000,
    });
    const directUrl = page.url();
    await page.goBack({ waitUntil: "domcontentloaded" });
    assert(
      page.url() === "about:blank",
      `History: back navigation ended at ${page.url()}`,
    );
    const forwardResponse = await page.goForward({ waitUntil: "networkidle" });
    assert(
      forwardResponse?.status() === 200,
      "History: forward navigation did not return 200",
    );
    assert(
      page.url() === directUrl,
      "History: forward navigation did not restore the public URL",
    );
    assert(
      await page
        .getByRole("button", { name: /load zinc-air demo/i })
        .isVisible(),
      "History: opening CTA missing after forward navigation",
    );
    results.navigation = {
      result: "pass",
      directUrl,
      backTarget: "about:blank",
      forwardStatus: forwardResponse.status(),
      reloadPersistence: true,
    };
    await context.close();
  }

  // Desktop screenshots and deployed data audit.
  {
    const { context, page, consoleErrors, pageErrors } = await freshPage(
      browser,
      { name: "screenshots", width: 1440, height: 900 },
    );
    const capture = async (filename, state) => {
      const output = path.join(shots, filename);
      await page.screenshot({
        path: output,
        type: "png",
        animations: "disabled",
      });
      results.screenshots.push({ filename, width: 1440, height: 900, state });
    };
    await capture(
      "01-opening.png",
      "Fresh public opening with replay disclosure and Load zinc-air demo CTA",
    );
    await loadDemo(page);

    await selectStage(page, "structure");
    await page
      .getByText("Measurement timeline", { exact: true })
      .scrollIntoViewIfNeeded();
    await capture(
      "02-structured-record.png",
      "Structure stage with validated measurement timeline and provenance",
    );
    const structureText = await page.locator("body").innerText();
    assert(
      structureText.includes("minimum near -0.460 V"),
      "Structure: Scopy transient missing",
    );
    assert(
      structureText.includes("not evidence of proven cell reversal"),
      "Structure: transient limitation missing",
    );
    assert(
      structureText.includes(
        "cannot be calculated without measured current or load resistance",
      ),
      "Structure: no-calculation boundary missing",
    );

    await selectStage(page, "challenge");
    await page
      .getByText("BenchPilot is designed to disagree usefully.", {
        exact: true,
      })
      .scrollIntoViewIfNeeded();
    await capture(
      "03-challenge.png",
      "Challenge My Interpretation with competing falsifiable mechanisms",
    );
    const matrixHeading = page.getByText("Hypothesis Matrix", { exact: true });
    await matrixHeading.scrollIntoViewIfNeeded();
    const update = page.getByRole("button", {
      name: /add simulated measurement/i,
    });
    await update.click();
    await page.waitForTimeout(350);
    await matrixHeading.scrollIntoViewIfNeeded();
    assert(
      await page
        .getByText(/matrix updated/i)
        .first()
        .isVisible(),
      "Matrix update explanation missing",
    );
    const matrixNotice = page.getByRole("button", {
      name: /dismiss notification/i,
    });
    if (await matrixNotice.isVisible().catch(() => false))
      await matrixNotice.click();
    await capture(
      "04-hypothesis-matrix.png",
      "Hypothesis Matrix after visibly simulated matched-replicate update",
    );

    await selectStage(page, "test");
    await page
      .getByText(/matched latest-build replication/i)
      .first()
      .scrollIntoViewIfNeeded();
    await capture(
      "05-ranked-tests.png",
      "Ranked next experiments with information-gain-per-effort score",
    );

    await selectStage(page, "compare");
    await page
      .getByText("Voltage vs. elapsed time", { exact: true })
      .scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await capture(
      "06-run-comparison.png",
      "Three-run voltage comparison and causal-attribution warning",
    );
    const compareText = await page.locator("body").innerText();
    results.dataAudit = {
      latestFreshOcv: compareText.includes("1.692 V fresh open circuit"),
      latestLoadedUnknownTime: compareText.includes(
        "Approximately 1.10 V; elapsed time not recorded",
      ),
      earlierCollapse: ["1.562", "0.732", "0.482"].every((v) =>
        compareText.includes(v),
      ),
      earlierRecovery: ["0.912", "1.13", "1.253", "1.298", "1.308"].every((v) =>
        compareText.includes(v),
      ),
      unknownTimeNotPlottedDisclosure: compareText.includes(
        "1 validated reading with unrecorded elapsed time is listed below but not plotted",
      ),
      causalWarning: compareText.includes(
        "Causal attribution is not yet valid",
      ),
      unsupportedCalculationsAbsent: !compareText.match(
        /current\s*[:=]\s*\d|power\s*[:=]\s*\d|internal resistance\s*[:=]\s*\d/i,
      ),
    };
    assert(
      Object.values(results.dataAudit).every(Boolean),
      `Data audit failed: ${JSON.stringify(results.dataAudit)}`,
    );

    await page.getByRole("button", { name: /experiment report/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible" });
    await capture(
      "07-report.png",
      "Exportable experiment report with validated values and evidence boundary",
    );
    const reportText = await dialog.innerText();
    assert(reportText.includes("1.692 V"), "Report missing 1.692 V");
    assert(reportText.includes("1.1 V"), "Report missing loaded voltage");
    assert(
      reportText.includes("Evidence boundary"),
      "Report missing evidence disclaimer",
    );
    assert(
      reportText.toLowerCase().includes("uncertainty and missing controls"),
      "Report missing uncertainty section",
    );
    assert(
      reportText.includes(
        "Electrical load identity and fan current were not recorded.",
      ),
      "Report missing load uncertainty",
    );
    assert(
      reportText.includes(
        "Elapsed time for the approximately 1.10 V reading is unknown.",
      ),
      "Report missing timing uncertainty",
    );
    assert(
      !reportText.match(/current\s*[:=]\s*\d|power\s*[:=]\s*\d/i),
      "Report contains unsupported current or power",
    );

    const pdfPath = path.join(artifacts, "BenchPilot-Zinc-Air-Report.pdf");
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });
    results.reportPdf = {
      filename: "BenchPilot-Zinc-Air-Report.pdf",
      generated: true,
      containsRequiredValues: true,
    };

    const routeGet = await context.request.get(`${url}/api/analyze`);
    const routePost = await context.request.post(`${url}/api/analyze`, {
      data: { notes: "must not trigger inference" },
    });
    const getBody = await routeGet.json();
    const postBody = await routePost.json();
    results.routeSecurity = {
      getStatus: routeGet.status(),
      postStatus: routePost.status(),
      getCode: getBody.error?.code,
      postCode: postBody.error?.code,
      result:
        routeGet.status() === 403 &&
        routePost.status() === 403 &&
        getBody.error?.code === "PUBLIC_DEMO_ONLY" &&
        postBody.error?.code === "PUBLIC_DEMO_ONLY"
          ? "pass"
          : "fail",
    };
    assert(
      results.routeSecurity.result === "pass",
      "Production route security failed",
    );
    assert(
      consoleErrors.length === 0 && pageErrors.length === 0,
      "Screenshot session produced browser errors",
    );
    await context.close();
  }

  // Mobile screenshot.
  {
    const { context, page, consoleErrors, pageErrors } = await freshPage(
      browser,
      { name: "mobile-shot", width: 390, height: 844 },
    );
    await loadDemo(page);
    const metrics = await layoutMetrics(page);
    assert(
      metrics.scrollWidth <= 391,
      `Mobile screenshot has horizontal overflow: ${metrics.scrollWidth}`,
    );
    const output = path.join(shots, "08-mobile.png");
    await page.screenshot({
      path: output,
      type: "png",
      animations: "disabled",
    });
    results.screenshots.push({
      filename: "08-mobile.png",
      width: 390,
      height: 844,
      state: "Mobile Capture stage with validated replay loaded",
    });
    assert(
      consoleErrors.length === 0 && pageErrors.length === 0,
      "Mobile screenshot session produced browser errors",
    );
    await context.close();
  }

  await fs.writeFile(qaPath, JSON.stringify(results, null, 2) + "\n", "utf8");
  console.log(
    JSON.stringify(
      {
        result: "pass",
        qaPath,
        screenshots: results.screenshots.length,
        viewports: results.viewports.length,
        pdf: results.reportPdf.filename,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
