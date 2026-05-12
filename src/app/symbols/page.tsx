import { SymbolSpecStatus } from "@/components/symbols/SymbolSpecStatus";
import { SymbolSpecTable } from "@/components/symbols/SymbolSpecTable";
import { Alert } from "@/components/ui/alert";
import { readSymbolCache } from "@/lib/ftmo/symbolCache";

const disclaimer =
  "This calculator is for estimation only. FTMO and MT5 symbol specifications may change. Always verify Contract Size, Tick Size, Tick Value, Min Lot, Max Lot, Lot Step and Commission directly in FTMO MT5 Market Watch - Specification before live trading. This is not financial advice. You are responsible for your own trading decisions and execution risk.";

export default async function SymbolsPage() {
  const cache = await readSymbolCache();

  return (
    <div className="space-y-6">
      <SymbolSpecStatus metadata={cache.metadata} />
      <SymbolSpecTable symbols={cache.symbols} />
      <Alert variant="warning">{disclaimer}</Alert>
    </div>
  );
}
