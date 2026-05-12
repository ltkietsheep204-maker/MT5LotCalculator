import { RefreshFTMODataButton } from "@/components/admin/RefreshFTMODataButton";
import { SymbolSpecStatus } from "@/components/symbols/SymbolSpecStatus";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readSymbolCache } from "@/lib/ftmo/symbolCache";

export default async function AdminPage() {
  const cache = await readSymbolCache();

  return (
    <div className="space-y-6">
      <SymbolSpecStatus metadata={cache.metadata} />
      <Card>
        <CardHeader>
          <CardTitle>Refresh FTMO Symbol Data</CardTitle>
          <CardDescription>
            The calculator is now preloaded with fixed BTCUSD, ETHUSD, and SOLUSD specs. Refresh is optional and only used for FTMO market data experiments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RefreshFTMODataButton />
        </CardContent>
      </Card>
      <Alert variant="warning">
        Scraped data must be verified again in FTMO MT5 Market Watch - Specification before live trading.
      </Alert>
    </div>
  );
}
