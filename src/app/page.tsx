import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { SymbolSpecStatus } from "@/components/symbols/SymbolSpecStatus";
import { Alert } from "@/components/ui/alert";
import { readSymbolCache } from "@/lib/ftmo/symbolCache";

const disclaimer =
  "This calculator is for estimation only. FTMO and MT5 symbol specifications may change. Always verify Contract Size, Tick Size, Tick Value, Min Lot, Max Lot, Lot Step and Commission directly in FTMO MT5 Market Watch - Specification before live trading. This is not financial advice. You are responsible for your own trading decisions and execution risk.";

export default async function HomePage() {
  const cache = await readSymbolCache();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <CalculatorForm />
        <SymbolSpecStatus metadata={cache.metadata} />
        <Alert variant="warning">{disclaimer}</Alert>
      </div>
      <div className="lg:col-span-1">
        <div className="sticky top-6 rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold leading-none tracking-tight">Trading Rules Reminder</h3>
          </div>
          <div className="p-4">
            <img 
              src="/loi-nhac.png" 
              alt="Trading Rules Reminder" 
              className="w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
