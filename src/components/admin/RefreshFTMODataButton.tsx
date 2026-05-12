"use client";

import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type RefreshResponse = {
  success: boolean;
  usedFallbackCache: boolean;
  symbolsFound: number;
  completeSymbols: number;
  incompleteSymbols: number;
  lastFetchedAt?: string;
  warnings: string[];
};

export function RefreshFTMODataButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RefreshResponse>();

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/symbols/refresh", { method: "POST" });
      setResult((await response.json()) as RefreshResponse);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button type="button" onClick={refresh} disabled={loading}>
        <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Refreshing..." : "Refresh FTMO data"}
      </Button>
      {result ? (
        <Alert variant={result.success ? "default" : "warning"}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>Success: {String(result.success)}</div>
            <div>Using fallback cache: {String(result.usedFallbackCache)}</div>
            <div>Symbols found: {result.symbolsFound}</div>
            <div>Complete: {result.completeSymbols}</div>
            <div>Incomplete: {result.incompleteSymbols}</div>
            <div>Last fetched: {result.lastFetchedAt ?? "Not available"}</div>
          </div>
          {result.warnings.length ? <div className="mt-3">{result.warnings.join(" ")}</div> : null}
          {!result.success ? <div className="mt-2 font-medium">App is using old cache or seed data.</div> : null}
        </Alert>
      ) : null}
    </div>
  );
}
