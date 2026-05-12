import { describe, expect, it, vi } from "vitest";
import { normalizeFTMOSymbol } from "@/lib/ftmo/normalizeFTMOSymbol";
import { parseFTMOQuoteFromHtml } from "@/lib/ftmo/scrapeFTMOQuotes";
import { parseRenderedTablesToRawRecords } from "@/lib/ftmo/scrapeFTMOSymbolsRendered";
import { parseFTMOHtmlForRawRecords } from "@/lib/ftmo/scrapeFTMOSymbols";
import { readSymbolCache, refreshSymbolCache } from "@/lib/ftmo/symbolCache";
import { validateSymbolSpec } from "@/lib/ftmo/validateSymbolSpec";

describe("normalizeFTMOSymbol", () => {
  it("normalizes raw crypto symbol data", () => {
    const result = normalizeFTMOSymbol({
      symbol: "BTC/USD",
      displayName: "Bitcoin",
      assetClass: "Crypto",
      platform: "MT5",
      rawContractSize: "1",
      rawMinLot: "0.01",
      rawMaxLot: "10",
      rawLotStep: "0.01",
      rawCommission: "0.1%",
      sourceUrl: "https://example.com",
      fetchedAt: "2026-05-12T00:00:00.000Z",
      warnings: []
    });

    expect(result.symbol).toBe("BTCUSD");
    expect(result.assetClass).toBe("crypto");
    expect(result.commissionType).toBe("percent_notional");
    expect(result.isCompleteForCalculation).toBe(true);
  });
});

describe("validateSymbolSpec", () => {
  it("marks incomplete specs and adds warnings", () => {
    const result = validateSymbolSpec({
      symbol: "ETHUSD",
      assetClass: "crypto",
      platform: "unknown",
      source: "seed",
      isCompleteForCalculation: false,
      warnings: []
    });

    expect(result.isCompleteForCalculation).toBe(false);
    expect(result.warnings).toContain("Missing tick value");
  });
});

describe("scraper parsing", () => {
  it("extracts crypto symbols from static HTML without live fetch", () => {
    const records = parseFTMOHtmlForRawRecords("<html><body>BTC/USD ETHUSD SOL USD</body></html>");
    expect(records.map((record) => record.symbol)).toContain("BTCUSD");
    expect(records.map((record) => record.symbol)).toContain("ETHUSD");
  });

  it("extracts a quote when symbol, bid, ask and spread are present", () => {
    const quote = parseFTMOQuoteFromHtml("<div>BTCUSD 104000.5 104010.5 10</div>", "BTCUSD");
    expect(quote.bid).toBe(104000.5);
    expect(quote.ask).toBe(104010.5);
    expect(quote.spread).toBe(10);
  });

  it("parses rendered ticker/spec rows into raw records", () => {
    const records = parseRenderedTablesToRawRecords([
      {
        headers: ["Symbol", "Bid Price", "Ask Price", "Spread", "Commissions"],
        rows: [["BTCUSD", "80,029.56", "80,030.56", "1.00", "0.065%"]]
      },
      {
        headers: ["Symbol", "Contract Size", "Tick Size", "Tick Value", "Min Lot", "Max Lot", "Lot Step"],
        rows: [["BTCUSD", "1", "0.01", "0.01", "0.01", "10", "0.01"]]
      }
    ]);

    expect(records).toHaveLength(1);
    expect(records[0]?.symbol).toBe("BTCUSD");
    expect(records[0]?.rawBidPrice).toBe("80,029.56");
    expect(records[0]?.rawTickValue).toBe("0.01");
  });
});

describe("cache fallback behavior", () => {
  it("uses seed data when cache is empty", async () => {
    const payload = await readSymbolCache();
    expect(payload.symbols.length).toBeGreaterThan(0);
    expect(payload.metadata.source).toBe("seed");
  });

  it("uses fallback cache when scraper fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );

    const result = await refreshSymbolCache();
    expect(result.success).toBe(false);
    expect(result.usedFallbackCache).toBe(true);
    expect(result.warnings.join(" ")).toContain("Refresh failed");
    vi.unstubAllGlobals();
  });
});
