import { promises as fs } from "fs";
import path from "path";
import type { FTMOSymbolSpec, SymbolCacheMetadata, SymbolCachePayload } from "@/types/symbol";
import seedSymbols from "@/data/seed-ftmo-crypto-symbols.json";
import { normalizeFTMOSymbol } from "./normalizeFTMOSymbol";
import { scrapeRenderedFTMOSymbols } from "./scrapeFTMOSymbolsRendered";
import { scrapeFTMOSymbols } from "./scrapeFTMOSymbols";

const cachePath = path.join(process.cwd(), "src/data/ftmo-symbols-cache.json");

function buildMetadata(
  symbols: FTMOSymbolSpec[],
  source: SymbolCacheMetadata["source"],
  warnings: string[] = []
): SymbolCacheMetadata {
  const completeSymbols = symbols.filter((symbol) => symbol.isCompleteForCalculation).length;
  const lastFetchedAt = symbols
    .map((symbol) => symbol.lastFetchedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    lastFetchedAt,
    source,
    numberOfSymbols: symbols.length,
    completeSymbols,
    incompleteSymbols: symbols.length - completeSymbols,
    warnings
  };
}

function normalizePayload(raw: unknown): FTMOSymbolSpec[] {
  if (Array.isArray(raw)) return raw as FTMOSymbolSpec[];
  if (raw && typeof raw === "object" && "symbols" in raw && Array.isArray(raw.symbols)) {
    return raw.symbols as FTMOSymbolSpec[];
  }
  return [];
}

export async function readSymbolCache(): Promise<SymbolCachePayload> {
  try {
    const content = await fs.readFile(cachePath, "utf8");
    const cached = normalizePayload(JSON.parse(content));
    if (cached.length > 0) {
      return {
        metadata: buildMetadata(cached, "cache"),
        symbols: cached
      };
    }
  } catch {
    // In Vercel/serverless production, replace runtime JSON writes with Supabase, Postgres, Redis, or KV.
  }

  const seed = seedSymbols as FTMOSymbolSpec[];
  return {
    metadata: buildMetadata(seed, "seed", ["Using seed placeholder data because cache is empty."]),
    symbols: seed
  };
}

export async function writeSymbolCache(symbols: FTMOSymbolSpec[]) {
  await fs.writeFile(cachePath, `${JSON.stringify(symbols, null, 2)}\n`, "utf8");
}

export type RefreshResult = {
  success: boolean;
  usedFallbackCache: boolean;
  symbolsFound: number;
  completeSymbols: number;
  incompleteSymbols: number;
  lastFetchedAt?: string;
  warnings: string[];
  symbols: FTMOSymbolSpec[];
};

export async function refreshSymbolCache(): Promise<RefreshResult> {
  const fallback = await readSymbolCache();
  const renderedScrapeResult = await scrapeRenderedFTMOSymbols();
  const scrapeResult = renderedScrapeResult.success ? renderedScrapeResult : await scrapeFTMOSymbols();

  if (!scrapeResult.success || scrapeResult.records.length === 0) {
    return {
      success: false,
      usedFallbackCache: true,
      symbolsFound: fallback.symbols.length,
      completeSymbols: fallback.metadata.completeSymbols,
      incompleteSymbols: fallback.metadata.incompleteSymbols,
      lastFetchedAt: fallback.metadata.lastFetchedAt,
      warnings: [
        "Refresh failed. Using existing cache or seed data.",
        ...renderedScrapeResult.warnings,
        ...scrapeResult.warnings
      ],
      symbols: fallback.symbols
    };
  }

  const symbols = scrapeResult.records.map(normalizeFTMOSymbol).filter((symbol) => symbol.assetClass === "crypto");
  await writeSymbolCache(symbols);
  const metadata = buildMetadata(symbols, "cache", scrapeResult.warnings);

  return {
    success: true,
    usedFallbackCache: false,
    symbolsFound: symbols.length,
    completeSymbols: metadata.completeSymbols,
    incompleteSymbols: metadata.incompleteSymbols,
    lastFetchedAt: scrapeResult.fetchedAt,
    warnings: scrapeResult.warnings,
    symbols
  };
}
