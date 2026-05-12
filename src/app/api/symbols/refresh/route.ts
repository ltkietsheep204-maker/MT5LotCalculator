import { NextResponse } from "next/server";
import { refreshSymbolCache } from "@/lib/ftmo/symbolCache";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await refreshSymbolCache();
    return NextResponse.json({
      success: result.success,
      usedFallbackCache: result.usedFallbackCache,
      symbolsFound: result.symbolsFound,
      completeSymbols: result.completeSymbols,
      incompleteSymbols: result.incompleteSymbols,
      lastFetchedAt: result.lastFetchedAt,
      warnings: result.warnings
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        usedFallbackCache: true,
        symbolsFound: 0,
        completeSymbols: 0,
        incompleteSymbols: 0,
        warnings: ["Unexpected refresh error. Existing cache was not modified."]
      },
      { status: 500 }
    );
  }
}
