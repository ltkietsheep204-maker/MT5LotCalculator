import type { SymbolCacheMetadata } from "@/types/symbol";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SymbolSpecStatus({ metadata }: { metadata: SymbolCacheMetadata }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Symbol Data Status</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-4">
        <div>
          <div className="text-sm text-muted-foreground">Source</div>
          <div className="font-medium">{metadata.source}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Symbols</div>
          <div className="font-medium">{metadata.numberOfSymbols}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Complete</div>
          <div className="font-medium">{metadata.completeSymbols}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Last Fetched</div>
          <div className="font-medium">{metadata.lastFetchedAt ?? "Not available"}</div>
        </div>
        {metadata.warnings.length ? (
          <Alert variant="warning" className="sm:col-span-4">
            {metadata.warnings.join(" ")}
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
