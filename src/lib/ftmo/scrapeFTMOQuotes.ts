import type { FTMOQuote } from "@/types/symbol";

const FTMO_SYMBOLS_URL = "https://ftmo.com/en/symbols/";

function parseNumericValue(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseFTMOQuoteFromHtml(
  html: string,
  symbol: string,
  fetchedAt = new Date().toISOString()
): FTMOQuote {
  const normalizedSymbol = symbol.toUpperCase();
  const compact = html.replace(/\s+/g, " ");
  const warnings: string[] = [];

  const directPattern = new RegExp(
    `${normalizedSymbol}[^\\d]{0,120}(\\d+(?:\\.\\d+)?)\\D+(\\d+(?:\\.\\d+)?)\\D+(\\d+(?:\\.\\d+)?)`,
    "i"
  );
  const directMatch = compact.match(directPattern);

  let bid = parseNumericValue(directMatch?.[1]);
  let ask = parseNumericValue(directMatch?.[2]);
  let spread = parseNumericValue(directMatch?.[3]);

  if (bid === undefined || ask === undefined) {
    const jsonLikePattern = new RegExp(
      `"symbol":"${normalizedSymbol}".{0,300}?"bid(?:Price)?":("?\\d+(?:\\.\\d+)?"?).{0,120}?"ask(?:Price)?":("?\\d+(?:\\.\\d+)?"?)`,
      "i"
    );
    const jsonLikeMatch = compact.match(jsonLikePattern);

    if (jsonLikeMatch) {
      bid = parseNumericValue(jsonLikeMatch[1]?.replace(/"/g, ""));
      ask = parseNumericValue(jsonLikeMatch[2]?.replace(/"/g, ""));
    }
  }

  if (bid !== undefined && ask !== undefined && spread === undefined) {
    spread = ask - bid;
  }

  if (bid === undefined || ask === undefined) {
    warnings.push("FTMO live quote was not available in the fetched page response.");
  }

  return {
    symbol: normalizedSymbol,
    bid,
    ask,
    spread,
    sourceUrl: FTMO_SYMBOLS_URL,
    fetchedAt,
    warnings
  };
}

export async function scrapeFTMOQuote(symbol: string): Promise<FTMOQuote> {
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
        symbol: symbol.toUpperCase(),
        sourceUrl: FTMO_SYMBOLS_URL,
        fetchedAt,
        warnings: [`FTMO quote request returned HTTP ${response.status}`]
      };
    }

    const html = await response.text();
    return parseFTMOQuoteFromHtml(html, symbol, fetchedAt);
  } catch (error) {
    return {
      symbol: symbol.toUpperCase(),
      sourceUrl: FTMO_SYMBOLS_URL,
      fetchedAt,
      warnings: [error instanceof Error ? error.message : "Unknown FTMO quote error"]
    };
  }
}
