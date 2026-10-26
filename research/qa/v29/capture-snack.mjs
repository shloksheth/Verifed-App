import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "./browser/node_modules/playwright-core/index.mjs";

const output = "research/qa/v29/captures";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage({
  viewport: { width: 1460, height: 960 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const errors = [];
const report = { method: "Expo Snack embedded web preview, browser-based (NOT physical iOS/Android)", snack: "https://snack.expo.dev/3VrwugCB__8sCwQhRftI9", screens: {}, errors };
page.on("pageerror", (err) => errors.push("page: " + err.message.slice(0, 500)));
page.on("console", (msg) => { if (msg.type() === "error") errors.push("console: " + msg.text().slice(0, 300)); });

async function visibleFrames() {
  const frames = [];
  for (const f of page.frames()) {
    try {
      const text = await f.locator("body").innerText({ timeout: 2000 });
      frames.push({ frame: f, url: f.url(), text });
    } catch {}
  }
  return frames;
}
async function capture(name) {
  // DevTools capture avoids Playwright's indefinite document.fonts.ready wait in Expo Snack.
  const client = await page.context().newCDPSession(page);
  const image = await client.send("Page.captureScreenshot",
    { format: "png", captureBeyondViewport: false, fromSurface: true });
  await fs.writeFile(path.join(output, name + ".png"), Buffer.from(image.data, "base64"));
  await client.detach();
  const frames = await visibleFrames();
  report.screens[name] = {
    frameText: frames.map(({ url, text }) => ({ url: url.slice(0, 250), text: text.slice(0, 3500) })),
    screenshot: name + ".png"
  };
}
async function clickOnPreview(label) {
  const frames = await visibleFrames();
  for (const { frame: f, text } of frames.reverse()) {
    if (!(text.includes("Verifed") || text.includes("verifed") || text.includes("Explore"))) continue;
    const candidates = [
      f.getByRole("tab", { name: label, exact: true }),
      f.getByRole("button", { name: label, exact: true }),
      f.getByText(label, { exact: true }),
      f.getByText(label, { exact: false })
    ];
    for (const locator of candidates) {
      try {
        if (await locator.count() > 0) {
          await locator.last().click({ timeout: 3500 });
          await page.waitForTimeout(2500);
          return true;
        }
      } catch {}
    }
  }
  errors.push("Could not interact with " + label);
  return false;
}
try {
  const url = "https://snack.expo.dev/embedded/3VrwugCB__8sCwQhRftI9?platform=web&preview=true&theme=light";
  try { await page.goto(url, { waitUntil: "domcontentloaded", timeout: 65000 }); }
  catch (err) { errors.push("Navigate: " + String(err)); }
  await page.waitForTimeout(22000);
  await capture("initial");
  const initial = (await visibleFrames()).map(f => f.text).join(" ");
  if (initial.includes("Explore as guest")) await clickOnPreview("Explore as guest");
  else if (initial.includes("Explore as Guest")) await clickOnPreview("Explore as Guest");
  else if (initial.includes("Get started")) {
    await clickOnPreview("Get started");
    await clickOnPreview("Explore as guest");
  }
  await capture("home");
  if (await clickOnPreview("Explore")) await capture("explore");
  if (await clickOnPreview("Journal")) await capture("journal");
  if (await clickOnPreview("Open quick actions")) await capture("plus-menu");
  if (await clickOnPreview("Scan")) await capture("scan");
} catch (err) {
  errors.push("Unexpected error: " + String(err));
} finally {
  await fs.writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
  await browser.close();
}
console.log(JSON.stringify({ captured: Object.keys(report.screens), errors: errors.slice(0, 25) }));
