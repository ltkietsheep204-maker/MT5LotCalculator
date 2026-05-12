export type RawFTMOSymbolRecord = {
  symbol?: string;
  displayName?: string;
  assetClass?: string;
  platform?: string;
  rawBidPrice?: string;
  rawAskPrice?: string;
  rawSpread?: string;
  rawContractSize?: string;
  rawTickSize?: string;
  rawTickValue?: string;
  rawMinLot?: string;
  rawMaxLot?: string;
  rawLotStep?: string;
  rawCommission?: string;
  rawTradingHours?: string;
  sourceUrl: string;
  fetchedAt: string;
  warnings: string[];
};

export type ScrapeFTMOResult = {
  success: boolean;
  records: RawFTMOSymbolRecord[];
  warnings: string[];
  fetchedAt: string;
  sourceUrl: string;
};

const FTMO_SYMBOLS_URL = "https://ftmo.com/en/symbols/";
const CRYPTO_SYMBOL_PATTERN = /\b(BTC|ETH|SOL|XRP|ADA|DOGE|LTC|BNB|DOT|LINK)\s*\/?\s*USD\b/gi;

export function parseFTMOHtmlForRawRecords(
  html: string,
  sourceUrl = FTMO_SYMBOLS_URL,
  fetchedAt = new Date().toISOString()
): RawFTMOSymbolRecord[] {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const matches = Array.from(text.matchAll(CRYPTO_SYMBOL_PATTERN));
  const symbols = Array.from(
    new Set(matches.map((match) => match[0].replace(/[^a-zA-Z]/g, "").toUpperCase()))
  );

  return symbols.map((symbol) => ({
    symbol,
    displayName: symbol,
    assetClass: "crypto",
    sourceUrl,
    fetchedAt,
    warnings: ["Partial scrape only. Verify full symbol specification in FTMO MT5."]
  }));
}

export async function scrapeFTMOSymbols(): Promise<ScrapeFTMOResult> {
  const fetchedAt = new Date().toISOString();

  try {
    const response = await fetch(FTMO_SYMBOLS_URL, {
      headers: {
        "user-agent": "FTMO Crypto Lot Calculator/0.1"
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return {
        success: false,
        records: [],
        warnings: [`FTMO symbols page returned HTTP ${response.status}`],
        fetchedAt,
        sourceUrl: FTMO_SYMBOLS_URL
      };
    }

    const html = await response.text();
    const records = parseFTMOHtmlForRawRecords(html, FTMO_SYMBOLS_URL, fetchedAt);
    const warnings =
      records.length === 0
        ? ["No crypto symbols were detected. FTMO page may be rendered by JavaScript or changed."]
        : ["Scraper captured partial records only unless all required fields are present."];

    return {
      success: records.length > 0,
      records,
      warnings,
      fetchedAt,
      sourceUrl: FTMO_SYMBOLS_URL
    };
  } catch (error) {
    return {
      success: false,
      records: [],
      warnings: [error instanceof Error ? error.message : "Unknown scraper error"],
      fetchedAt,
      sourceUrl: FTMO_SYMBOLS_URL
    };
  }
}
