import type { RawFTMOSymbolRecord, ScrapeFTMOResult } from "./scrapeFTMOSymbols";

const FTMO_SYMBOLS_URL = "https://ftmo.com/en/symbols/";

type ExtractedTable = {
  headers: string[];
  rows: string[][];
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function findColumnIndex(headers: string[], candidates: string[]) {
  return headers.findIndex((header) =>
    candidates.some((candidate) => normalizeHeader(header).includes(candidate))
  );
}

function isCryptoSymbol(value: string) {
  return /^[A-Z0-9.-]{4,}$/.test(value) && /USD$/.test(value);
}

export function parseRenderedTablesToRawRecords(
  tables: ExtractedTable[],
  sourceUrl = FTMO_SYMBOLS_URL,
  fetchedAt = new Date().toISOString()
): RawFTMOSymbolRecord[] {
  const bySymbol = new Map<string, RawFTMOSymbolRecord>();

  for (const table of tables) {
    const headers = table.headers.map(normalizeHeader);

    const symbolIndex = findColumnIndex(headers, ["symbol", "ticker"]);
    if (symbolIndex === -1) continue;

    const bidIndex = findColumnIndex(headers, ["bid"]);
    const askIndex = findColumnIndex(headers, ["ask"]);
    const spreadIndex = findColumnIndex(headers, ["spread"]);
    const commissionIndex = findColumnIndex(headers, ["commission"]);
    const contractSizeIndex = findColumnIndex(headers, ["contract size"]);
    const tickSizeIndex = findColumnIndex(headers, ["tick size"]);
    const tickValueIndex = findColumnIndex(headers, ["tick value"]);
    const minLotIndex = findColumnIndex(headers, ["min lot", "min volume"]);
    const maxLotIndex = findColumnIndex(headers, ["max lot", "max volume"]);
    const lotStepIndex = findColumnIndex(headers, ["lot step", "volume step"]);
    const hoursIndex = findColumnIndex(headers, ["trading hours", "session"]);
    const platformIndex = findColumnIndex(headers, ["platform"]);

    for (const row of table.rows) {
      const symbol = row[symbolIndex]?.replace(/\s+/g, "").toUpperCase();
      if (!symbol || !isCryptoSymbol(symbol)) continue;

      const existing = bySymbol.get(symbol) ?? {
        symbol,
        displayName: symbol,
        assetClass: "crypto",
        sourceUrl,
        fetchedAt,
        warnings: []
      };

      const next: RawFTMOSymbolRecord = {
        ...existing,
        rawBidPrice: bidIndex >= 0 ? row[bidIndex] : existing.rawBidPrice,
        rawAskPrice: askIndex >= 0 ? row[askIndex] : existing.rawAskPrice,
        rawSpread: spreadIndex >= 0 ? row[spreadIndex] : existing.rawSpread,
        rawCommission: commissionIndex >= 0 ? row[commissionIndex] : existing.rawCommission,
        rawContractSize: contractSizeIndex >= 0 ? row[contractSizeIndex] : existing.rawContractSize,
        rawTickSize: tickSizeIndex >= 0 ? row[tickSizeIndex] : existing.rawTickSize,
        rawTickValue: tickValueIndex >= 0 ? row[tickValueIndex] : existing.rawTickValue,
        rawMinLot: minLotIndex >= 0 ? row[minLotIndex] : existing.rawMinLot,
        rawMaxLot: maxLotIndex >= 0 ? row[maxLotIndex] : existing.rawMaxLot,
        rawLotStep: lotStepIndex >= 0 ? row[lotStepIndex] : existing.rawLotStep,
        rawTradingHours: hoursIndex >= 0 ? row[hoursIndex] : existing.rawTradingHours,
        platform: platformIndex >= 0 ? row[platformIndex] : existing.platform
      };

      bySymbol.set(symbol, next);
    }
  }

  return Array.from(bySymbol.values()).map((record) => ({
    ...record,
    warnings:
      record.rawBidPrice || record.rawContractSize
        ? record.warnings
        : ["FTMO rendered table did not expose full values for this symbol."]
  }));
}

export async function scrapeRenderedFTMOSymbols(): Promise<ScrapeFTMOResult> {
  const fetchedAt = new Date().toISOString();

  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1600 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    });
    const page = await context.newPage();

    await page.goto(FTMO_SYMBOLS_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    const cookieButton = page.getByRole("button", { name: /accept|ok|allow/i }).first();
    if (await cookieButton.isVisible().catch(() => false)) {
      await cookieButton.click().catch(() => undefined);
    }

    const cryptoTab = page.getByText(/^Crypto$/).first();
    if (await cryptoTab.isVisible().catch(() => false)) {
      await cryptoTab.click().catch(() => undefined);
    }

    await page.waitForTimeout(5000);

    const tables = await page.evaluate(() => {
      const getText = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();

      return Array.from(document.querySelectorAll("table"))
        .map((table) => {
          const headers = Array.from(table.querySelectorAll("th")).map((cell) => getText(cell.textContent));
          const rows = Array.from(table.querySelectorAll("tbody tr, tr"))
            .map((row) =>
              Array.from(row.querySelectorAll("td"))
                .map((cell) => getText(cell.textContent))
                .filter(Boolean)
            )
            .filter((row) => row.length > 0);

          return { headers, rows };
        })
        .filter((table) => table.headers.length > 0 && table.rows.length > 0);
    });

    await browser.close();

    const records = parseRenderedTablesToRawRecords(tables, FTMO_SYMBOLS_URL, fetchedAt);
    return {
      success: records.length > 0,
      records,
      warnings:
        records.length > 0
          ? ["Loaded FTMO data from browser-rendered tables."]
          : ["Rendered FTMO tables were found, but no crypto symbol rows could be parsed."],
      fetchedAt,
      sourceUrl: FTMO_SYMBOLS_URL
    };
  } catch (error) {
    return {
      success: false,
      records: [],
      warnings: [error instanceof Error ? error.message : "Unknown rendered scraper error"],
      fetchedAt,
      sourceUrl: FTMO_SYMBOLS_URL
    };
  }
}
