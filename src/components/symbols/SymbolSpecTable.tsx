"use client";

import { useMemo, useState } from "react";
import type { FTMOSymbolSpec } from "@/types/symbol";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SymbolSpecTable({ symbols }: { symbols: FTMOSymbolSpec[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "crypto" | "complete" | "incomplete">("all");

  const filtered = useMemo(() => {
    return symbols.filter((symbol) => {
      if (search && !symbol.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "crypto" && symbol.assetClass !== "crypto") return false;
      if (filter === "complete" && !symbol.isCompleteForCalculation) return false;
      if (filter === "incomplete" && symbol.isCompleteForCalculation) return false;
      return true;
    });
  }, [filter, search, symbols]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Symbol Specifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Search symbol" value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            {(["all", "crypto", "complete", "incomplete"] as const).map((value) => (
              <button
                key={value}
                className={`rounded-md border px-3 py-2 text-sm ${filter === value ? "bg-primary text-primary-foreground" : "bg-background"}`}
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead className="bg-muted">
              <tr>
                {[
                  "Symbol",
                  "Display Name",
                  "Bid",
                  "Ask",
                  "Spread",
                  "Asset Class",
                  "Platform",
                  "Contract Size",
                  "Tick Size",
                  "Tick Value",
                  "Min Lot",
                  "Max Lot",
                  "Lot Step",
                  "Commission Type",
                  "Commission Value",
                  "Complete?",
                  "Last Fetched",
                  "Warnings"
                ].map((head) => (
                  <th key={head} className="px-3 py-2 text-left font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((symbol) => (
                <tr key={symbol.symbol} className={symbol.isCompleteForCalculation ? "border-t" : "border-t bg-accent/10"}>
                  <td className="px-3 py-2 font-medium">{symbol.symbol}</td>
                  <td className="px-3 py-2">{symbol.displayName ?? "-"}</td>
                  <td className="px-3 py-2">{symbol.bidPrice ?? "-"}</td>
                  <td className="px-3 py-2">{symbol.askPrice ?? "-"}</td>
                  <td className="px-3 py-2">{symbol.spread ?? "-"}</td>
                  <td className="px-3 py-2">{symbol.assetClass}</td>
                  <td className="px-3 py-2">{symbol.platform}</td>
                  <td className="px-3 py-2">{symbol.contractSize ?? "-"}</td>
                  <td className="px-3 py-2">{symbol.tickSize ?? "-"}</td>
                  <td className="px-3 py-2">{symbol.tickValue ?? "-"}</td>
                  <td className="px-3 py-2">{symbol.minLot ?? "-"}</td>
                  <td className="px-3 py-2">{symbol.maxLot ?? "-"}</td>
                  <td className="px-3 py-2">{symbol.lotStep ?? "-"}</td>
                  <td className="px-3 py-2">{symbol.commissionType ?? "-"}</td>
                  <td className="px-3 py-2">{symbol.commissionValue ?? "-"}</td>
                  <td className="px-3 py-2">
                    <Badge variant={symbol.isCompleteForCalculation ? "default" : "warning"}>
                      {symbol.isCompleteForCalculation ? "Complete" : "Incomplete"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">{symbol.lastFetchedAt ?? "-"}</td>
                  <td className="px-3 py-2">{symbol.warnings.join("; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
