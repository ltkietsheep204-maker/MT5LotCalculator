import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const TARGET_URL = "https://ftmo.com/en/symbols/";
const OUTPUT_DIR = path.join(process.cwd(), "tmp");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "ftmo-symbols-probe.json");
const MAX_BODY_LENGTH = 4000;

function isInteresting(url) {
  return /symbol|ticker|spread|quote|tick|bid|ask|api|graphql/i.test(url);
}

function trimText(value) {
  if (!value) return "";
  return value.length > MAX_BODY_LENGTH ? `${value.slice(0, MAX_BODY_LENGTH)}\n...[truncated]` : value;
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
  });
  const page = await context.newPage();
  const events = [];

  page.on("request", (request) => {
    const url = request.url();
    if (!isInteresting(url)) return;

    events.push({
      phase: "request",
      url,
      method: request.method(),
      resourceType: request.resourceType(),
      headers: request.headers(),
      postData: trimText(request.postData() ?? "")
    });
  });

  page.on("response", async (response) => {
    const url = response.url();
    if (!isInteresting(url)) return;

    let body = "";
    try {
      const contentType = response.headers()["content-type"] ?? "";
      if (/json|text|javascript/.test(contentType)) {
        body = trimText(await response.text());
      }
    } catch {
      body = "";
    }

    events.push({
      phase: "response",
      url,
      status: response.status(),
      headers: response.headers(),
      body
    });
  });

  const pageErrors = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(12000);

  const html = await page.content();
  const tableText = await page.locator("body").innerText();
  const rows = await page.locator("table tr").allInnerTexts().catch(() => []);

  const result = {
    targetUrl: TARGET_URL,
    capturedAt: new Date().toISOString(),
    title: await page.title(),
    pageErrors,
    rowCount: rows.length,
    rowPreview: rows.slice(0, 20),
    hasBTCUSD: /BTCUSD/i.test(tableText),
    hasBidAsk: /Bid Price|Ask Price/i.test(tableText),
    htmlSnippet: trimText(html),
    textSnippet: trimText(tableText),
    events
  };

  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(`Saved probe report to ${OUTPUT_FILE}`);
  console.log(`Captured ${events.length} matching request/response events`);
  console.log(`Row count: ${rows.length}`);
  console.log(`Contains BTCUSD: ${result.hasBTCUSD}`);
  console.log(`Contains Bid/Ask labels: ${result.hasBidAsk}`);

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
