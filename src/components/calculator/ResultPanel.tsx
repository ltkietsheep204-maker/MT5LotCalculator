"use client";

import { Copy } from "lucide-react";
import type { LotCalculationResult } from "@/types/calculator";
import type { FTMOSymbolSpec } from "@/types/symbol";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  result?: LotCalculationResult;
  symbol?: FTMOSymbolSpec;
};

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });

export function ResultPanel({ result, symbol }: Props) {
  const rows = result
      ? [
        ["Raw Lot", number.format(result.rawLot)],
        ["Rounded Lot", number.format(result.roundedLot)],
        ["Risk Amount", `$${money.format(result.riskAmount)}`],
        ["Estimated Loss", `$${money.format(result.estimatedLoss)}`],
        ["Estimated Commission", `$${money.format(result.estimatedCommission)}`],
        ["Total Estimated Risk", `$${money.format(result.totalEstimatedRisk)}`],
        ["Estimated Profit At TP", `$${money.format(result.estimatedProfitAtTp)}`],
        ["Risk : Reward", result.riskRewardRatio ? `1 : ${number.format(result.riskRewardRatio)}` : "-"],
        ["Minimum Executable Lot", result.minimumExecutableLot ? number.format(result.minimumExecutableLot) : "-"],
        ["Minimum Lot Risk", result.minimumLotRisk ? `$${money.format(result.minimumLotRisk)}` : "-"],
        ["Effective Risk %", `${number.format(result.effectiveRiskPercent)}%`],
        ["Stop Loss Distance", number.format(result.priceDistance)],
        ["Loss Per 1 Lot", `$${money.format(result.lossPerOneLot)}`],
        ["Min Lot", symbol?.minLot ?? "-"],
        ["Max Lot", symbol?.maxLot ?? "-"],
        ["Lot Step", symbol?.lotStep ?? "-"],
        ["Contract Size", symbol?.contractSize ?? "-"]
      ]
    : [];

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border bg-primary/10 p-5">
          <div className="text-sm text-muted-foreground">Suggested Lot</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-4xl font-semibold tracking-normal">
              {result ? number.format(result.finalLot) : "--"}
            </div>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              title="Copy final lot"
              disabled={!result}
              onClick={() => result && navigator.clipboard.writeText(String(result.finalLot))}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 rounded-md bg-background/70 px-3 py-2 text-sm">
            <div className="text-muted-foreground">Estimated Overnight Swap</div>
            <div className="mt-1 font-medium">
              {result ? `$${money.format(result.estimatedOvernightSwap)}` : "--"}
            </div>
          </div>
        </div>

        {result?.warnings.length ? (
          <Alert variant="warning">
            <div className="font-medium">Warnings</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        <div className="grid gap-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-right font-medium">{value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
