import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const publicUrl = "https://benchpilot-build-week.samuraicobra.chatgpt.site";
const chrome = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
const ffmpeg =
  "C:/Users/Avatar.Avatar-PC/AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe";
const root = process.cwd();
const videoDir = path.join(root, "submission", "video");
const rawDir = path.join(root, "tmp", "video");
const rawPath = path.join(rawDir, "BenchPilot-demo-raw.webm");
const outputPath = path.join(videoDir, "BenchPilot-Build-Week-Demo.webm");
const metadataPath = path.join(videoDir, "BenchPilot-Build-Week-Demo.json");

await fs.mkdir(videoDir, { recursive: true });
await fs.mkdir(rawDir, { recursive: true });
await fs.rm(rawPath, { force: true });
await fs.rm(outputPath, { force: true });

const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
});
const recordingStartedAt = Date.now();
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  colorScheme: "light",
  reducedMotion: "no-preference",
  locale: "en-US",
  recordVideo: {
    dir: rawDir,
    size: { width: 1920, height: 1080 },
  },
});
const page = await context.newPage();
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => {
  const source = message.location().url;
  const optionalFavicon =
    source === `${publicUrl}/favicon.ico` && message.text().includes("404");
  if (message.type() === "error" && !optionalFavicon)
    browserErrors.push(`${message.text()} (${source})`);
});

await page.goto(publicUrl, { waitUntil: "networkidle" });
await page.evaluate(() =>
  localStorage.removeItem("benchpilot:experiment-workspace:v1"),
);
await page.reload({ waitUntil: "networkidle" });
await page
  .getByRole("button", { name: /load zinc-air demo/i })
  .waitFor({ state: "visible" });

await page.evaluate(() => {
  const caption = document.createElement("div");
  caption.id = "benchpilot-demo-caption";
  caption.setAttribute("aria-hidden", "true");
  Object.assign(caption.style, {
    position: "fixed",
    left: "50%",
    bottom: "32px",
    transform: "translateX(-50%)",
    zIndex: "2147483646",
    width: "min(1540px, calc(100vw - 96px))",
    padding: "18px 26px",
    border: "1px solid rgba(255,255,255,.28)",
    borderRadius: "18px",
    background: "rgba(13,33,27,.93)",
    boxShadow: "0 14px 44px rgba(13,33,27,.28)",
    color: "#fffef9",
    font: "600 28px/1.35 'Segoe UI', sans-serif",
    textAlign: "center",
    letterSpacing: ".005em",
    pointerEvents: "none",
  });
  document.body.appendChild(caption);
});

const readyAt = Date.now();
const contentStart = Date.now();
const preludeSeconds = Math.max(0, (readyAt - recordingStartedAt) / 1000 - 0.7);

async function until(milliseconds) {
  const remaining = milliseconds - (Date.now() - contentStart);
  if (remaining > 0) await page.waitForTimeout(remaining);
}

async function setCaption(text) {
  await page.locator("#benchpilot-demo-caption").evaluate((node, value) => {
    node.textContent = value;
  }, text);
}

async function moveTo(locator, steps = 28) {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`Cannot move to hidden locator: ${locator}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps,
  });
}

async function focusOn(locator, block = "center") {
  const element = await locator.elementHandle();
  if (!element) throw new Error("Cannot focus missing element");
  await element.evaluate(
    (node, align) => node.scrollIntoView({ behavior: "smooth", block: align }),
    block,
  );
  await page.waitForTimeout(450);
  if (block === "start") {
    await page.evaluate(() =>
      window.scrollBy({ top: -140, behavior: "smooth" }),
    );
    await page.waitForTimeout(450);
  } else {
    await page.waitForTimeout(200);
  }
  await moveTo(locator, 24);
}

async function clickTab(name) {
  const tab = page.getByRole("tab", { name: new RegExp(name, "i") });
  await moveTo(tab);
  await tab.click();
  await page.waitForTimeout(500);
}

async function dismissNotice() {
  const dismiss = page.getByRole("button", { name: /dismiss notification/i });
  if (await dismiss.isVisible().catch(() => false)) await dismiss.click();
}

await setCaption(
  "Independent inventors create real experimental data, but photos, readings, and rough notes rarely become reproducible evidence. BenchPilot turns that messy record into a rigorous next move.",
);
const demoButton = page.getByRole("button", { name: /load zinc-air demo/i });
await page.mouse.move(1860, 1020);
await until(6500);
await moveTo(demoButton, 42);
await until(10000);

await setCaption(
  "This real zinc-air prototype measured 1.692 volts fresh open circuit and approximately 1.100 volts under load in an improvised Tic Tac container, using an Analog Devices Scopy voltmeter.",
);
await demoButton.click();
await page.getByRole("tab", { name: /capture/i }).waitFor({ state: "visible" });
await page.waitForTimeout(650);
await dismissNotice();
await focusOn(page.getByPlaceholder(/paste readings, materials/i), "center");
await until(17000);
await focusOn(
  page.getByText(/latest version sustains approximately 1\.10 V/i).first(),
  "center",
);
await until(25000);

await setCaption(
  "GPT-5.6 structured the evidence into a validated record: materials, measurements, safety, and missing controls.",
);
await clickTab("structure");
await focusOn(
  page.getByText("Measurement timeline", { exact: true }),
  "center",
);
await until(36000);

await setCaption(
  "The -0.460-volt screenshot minimum remains an uncertain transient, not proven reversal. Without current or load resistance, BenchPilot refuses to invent current, resistance, or power.",
);
await focusOn(page.getByText(/minimum near -0\.460 V/i).first(), "center");
await until(40500);
await focusOn(
  page
    .getByText(
      /cannot be calculated without measured current or load resistance/i,
    )
    .first(),
  "center",
);
await until(45000);

await setCaption(
  "Challenge My Interpretation proposes three falsifiable mechanisms: electrolyte wetting, air-cathode transport, and electrical contact—each with evidence, counter-evidence, unknowns, confidence, and a falsifier.",
);
await clickTab("challenge");
await focusOn(
  page.getByText("BenchPilot is designed to disagree usefully.", {
    exact: true,
  }),
  "start",
);
await until(56000);
await focusOn(
  page.getByText("Would falsify it", { exact: true }).first(),
  "center",
);
await until(65000);

await setCaption(
  "The Hypothesis Matrix makes the reasoning visible. A clearly simulated matched-replicate outcome updates support without becoming observed data.",
);
const matrixHeading = page.getByText("Hypothesis Matrix", { exact: true });
await focusOn(matrixHeading, "start");
await until(70500);
const simulate = page.getByRole("button", {
  name: /add simulated measurement/i,
});
await moveTo(simulate, 32);
await until(72500);
await simulate.click();
await page.waitForTimeout(700);
await dismissNotice();
await focusOn(matrixHeading, "start");
await until(78000);

await setCaption(
  "The next experiment is ranked by information gained per unit effort.",
);
await clickTab("test");
await focusOn(
  page.getByText(/matched latest-build replication/i).first(),
  "start",
);
await moveTo(page.getByText("9.7", { exact: true }), 30);
await until(85000);

await setCaption(
  "Compare the latest result with the collapse to 0.482 volts and the earlier recovery to 1.308 volts. Every chart point is validated, and ten uncontrolled variables prevent causal attribution.",
);
await clickTab("compare");
await focusOn(
  page.getByText("Voltage vs. elapsed time", { exact: true }),
  "start",
);
await until(91500);
await focusOn(
  page.getByText("Causal attribution is not yet valid", { exact: true }),
  "center",
);
await until(96500);
await focusOn(
  page.getByText("Readable measurement timeline", { exact: true }),
  "start",
);
await until(100000);

await setCaption(
  "BenchPilot turns messy physical experiments into reproducible evidence.",
);
const reportButton = page.getByRole("button", { name: /experiment report/i });
await moveTo(reportButton, 30);
await reportButton.click();
await page.getByRole("dialog").waitFor({ state: "visible" });
await moveTo(page.getByRole("button", { name: /print \/ save PDF/i }), 30);
await until(105000);

if (browserErrors.length)
  throw new Error(
    `Browser errors during recording: ${browserErrors.join(" | ")}`,
  );
const video = page.video();
await page.close();
if (!video) throw new Error("Playwright did not create a video stream");
await video.saveAs(rawPath);
await context.close();
await browser.close();

execFileSync(
  ffmpeg,
  [
    "-y",
    "-i",
    rawPath,
    "-ss",
    preludeSeconds.toFixed(3),
    "-t",
    "105",
    "-an",
    "-c:v",
    "libvpx",
    "-b:v",
    "4200k",
    "-deadline",
    "good",
    outputPath,
  ],
  { stdio: "pipe" },
);

await fs.writeFile(
  metadataPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: publicUrl,
      output: path.basename(outputPath),
      format: "WebM (VP8, silent, burned-in captions)",
      resolution: "1920x1080",
      intendedDurationSeconds: 105,
      trimmedPreludeSeconds: Number(preludeSeconds.toFixed(3)),
      captionsSource: "DEMO_CAPTIONS.srt",
      browserErrors,
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(
  JSON.stringify(
    {
      outputPath,
      metadataPath,
      resolution: "1920x1080",
      durationTargetSeconds: 105,
      preludeSeconds,
    },
    null,
    2,
  ),
);
