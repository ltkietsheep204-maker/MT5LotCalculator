import { NextResponse } from "next/server";
import { parseNumberText } from "@/lib/ftmo/parseFTMOSymbols";
import { scrapeRenderedFTMOSymbols } from "@/lib/ftmo/scrapeFTMOSymbolsRendered";
import { scrapeFTMOQuote } from "@/lib/ftmo/scrapeFTMOQuotes";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { symbol: string } }
) {
  const rendered = await scrapeRenderedFTMOSymbols();
  const renderedMatch = rendered.records.find(
    (record) => record.symbol?.toUpperCase() === params.symbol.toUpperCase()
  );

  if (renderedMatch) {
    const bid = parseNumberText(renderedMatch.rawBidPrice);
    const ask = parseNumberText(renderedMatch.rawAskPrice);
    const spread = parseNumberText(renderedMatch.rawSpread);
    const status = bid !== undefined || ask !== undefined ? 200 : 503;

    return NextResponse.json(
      {
        symbol: params.symbol.toUpperCase(),
        bid,
        ask,
        spread,
        sourceUrl: rendered.sourceUrl,
        fetchedAt: rendered.fetchedAt,
        warnings: rendered.warnings
      },
      { status }
    );
  }

  const quote = await scrapeFTMOQuote(params.symbol);
  const status = quote.bid !== undefined || quote.ask !== undefined ? 200 : 503;

  return NextResponse.json(quote, { status });
}
