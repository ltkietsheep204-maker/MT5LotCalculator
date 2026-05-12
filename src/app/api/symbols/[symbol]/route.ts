import { NextResponse } from "next/server";
import { readSymbolCache } from "@/lib/ftmo/symbolCache";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { symbol: string } }) {
  const payload = await readSymbolCache();
  const wanted = params.symbol.toUpperCase();
  const symbol = payload.symbols.find((item) => item.symbol.toUpperCase() === wanted);

  if (!symbol) {
    return NextResponse.json({ error: "Symbol not found" }, { status: 404 });
  }

  return NextResponse.json(symbol);
}
