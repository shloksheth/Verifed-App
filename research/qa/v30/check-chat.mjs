import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.VERIFED_PLAYWRIGHT
  ? pathToFileURL(process.env.VERIFED_PLAYWRIGHT).href : "playwright-core");
const output = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1"));
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.VERIFED_CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const errors = [];
const checks = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  async function capture(name) {
    // RN's modal fade takes a moment after controls become interactive.
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(output, name + ".png") });
  }
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.VERIFED_PREVIEW || "http://localhost:5183", { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.getByRole("button", { name: "Explore as a guest", exact: true }).click({ timeout: 120000 });
  await page.getByRole("button", { name: "Close dietary preferences and explore as a guest", exact: true }).click();
  await page.getByRole("tab", { name: "Home", exact: true }).click();
  await capture("home");
  await page.getByRole("button", { name: "Open menu chat from Home", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Message menu chat", exact: true });
  await input.fill("Any text works here");
  await page.getByRole("button", { name: "Send chat message", exact: true }).click();
  await page.getByText(/Let's use Camarones al Ajillo/).waitFor();
  for (const reply of ["For a milk allergy, the written", "You can show staff this question:"]) {
    await input.fill("Another unrelated message");
    await input.press("Enter");
    await page.getByText(reply, { exact: false }).waitFor();
  }
  await capture("chat-spanish");
  await page.getByRole("button", { name: "Close menu chat", exact: true }).click();
  await page.getByRole("button", { name: "Open menu chat", exact: true }).click();
  await page.getByText("You can show staff this question:", { exact: false }).waitFor();
  checks.push("Home and smile-tab entry, arbitrary typed inputs, keyboard send and retained transcript");
  await page.getByRole("button", { name: "Restart chat demo", exact: true }).click();
  if (await page.getByText("You can show staff this question:", { exact: false }).count()) throw Error("Restart retained old messages");
  await page.getByRole("button", { name: /Send example: What does Camarones/ }).click();
  await page.getByText(/Let's use Camarones al Ajillo/).waitFor();
  checks.push("Restart and suggested example prompt");
  await page.getByRole("button", { name: "Close menu chat", exact: true }).click();
  await page.getByRole("button", { name: "Open quick actions", exact: true }).click();
  await page.getByRole("button", { name: "Menu chat", exact: true }).click();
  await input.waitFor();
  checks.push("Plus menu opens the same panel");
  await page.getByRole("button", { name: "Close menu chat", exact: true }).click();
  await page.getByRole("tab", { name: "Scan", exact: true }).click();
  await page.getByText("Menus across languages", { exact: true }).waitFor();
  await capture("scan");
  await page.getByRole("button", { name: "Open menu chat from Scan", exact: true }).click();
  await input.waitFor();
  await capture("scan-chat");
  await page.getByRole("button", { name: "Close menu chat", exact: true }).click();
  checks.push("Scan entry and language information; closing preserves Scan route");
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole("tab", { name: "Home", exact: true }).click();
  await capture("compact-home");
  await page.getByRole("button", { name: "Open menu chat", exact: true }).click();
  await capture("compact-chat");
  const sendBox = await page.getByRole("button", { name: "Send chat message", exact: true }).boundingBox();
  if (!sendBox || sendBox.x < 0 || sendBox.x + sendBox.width > 320 || sendBox.y + sendBox.height > 640) throw Error("Compact composer overflows");
  checks.push("320 × 640 panel composer remains in viewport");
  await page.setViewportSize({ width: 1280, height: 900 });
  await capture("desktop-chat");
  if (errors.length) throw Error(errors.join("\n"));
} finally {
  await fs.writeFile(path.join(output, "report.json"), JSON.stringify({ method: "Local Expo React Native Web in headless Chrome; not native device testing", checks, errors }, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ checks, errors }, null, 2));
