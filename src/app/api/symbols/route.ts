import { NextResponse } from "next/server";
import { readSymbolCache } from "@/lib/ftmo/symbolCache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetClass = searchParams.get("assetClass");
  const completeOnly = searchParams.get("completeOnly") === "true";
  const payload = await readSymbolCache();

  const symbols = payload.symbols.filter((symbol) => {
    if (assetClass && symbol.assetClass !== assetClass) return false;
    if (completeOnly && !symbol.isCompleteForCalculation) return false;
    return true;
  });

  return NextResponse.json({
    metadata: {
      ...payload.metadata,
      numberOfSymbols: symbols.length
    },
    symbols
  });
}
