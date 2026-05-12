"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { LotCalculationResult } from "@/types/calculator";
import type { FTMOSymbolSpec, FTMOQuote } from "@/types/symbol";
import { calculateLotSize } from "@/lib/trading/calculateLotSize";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ManualSymbolOverride } from "@/components/symbols/ManualSymbolOverride";
import { ResultPanel } from "./ResultPanel";

const formSchema = z.object({
  accountBalance: z.coerce.number().positive(),
  riskMode: z.enum(["percent", "fixed"]),
  riskValue: z.coerce.number().positive(),
  symbol: z.string().min(1),
  direction: z.enum(["long", "short"]),
  entryPrice: z.coerce.number().positive(),
  stopLossPrice: z.coerce.number().positive(),
  takeProfitPrice: z.union([z.coerce.number().positive(), z.literal(0)]),
  includeCommission: z.boolean()
});

type FormValues = z.infer<typeof formSchema>;
type PriceMode = "manual" | "market";

const preferenceKey = "ftmo-calculator-preferences";

export function CalculatorForm() {
  const [symbols, setSymbols] = useState<FTMOSymbolSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [manualOverride, setManualOverride] = useState<FTMOSymbolSpec>();
  const [priceMode, setPriceMode] = useState<PriceMode>("manual");
  const [quote, setQuote] = useState<FTMOQuote>();
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string>();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountBalance: 10000,
      riskMode: "percent",
      riskValue: 1,
      symbol: "",
      direction: "long",
      entryPrice: 0,
      stopLossPrice: 0,
      takeProfitPrice: 0,
      includeCommission: true
    }
  });

  useEffect(() => {
    const stored = localStorage.getItem(preferenceKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<FormValues> & {
        riskPercent?: number;
        riskAmount?: number;
        lastSelectedSymbol?: string;
        priceMode?: PriceMode;
      };
      setPriceMode(parsed.priceMode ?? "manual");
      form.reset({
        accountBalance: parsed.accountBalance ?? 10000,
        riskMode: parsed.riskMode ?? "percent",
        riskValue: parsed.riskMode === "fixed" ? parsed.riskAmount ?? 100 : parsed.riskPercent ?? 1,
        symbol: parsed.lastSelectedSymbol ?? "",
        direction: parsed.direction ?? "long",
        entryPrice: parsed.entryPrice ?? 0,
        stopLossPrice: parsed.stopLossPrice ?? 0,
        takeProfitPrice: parsed.takeProfitPrice ?? 0,
        includeCommission: parsed.includeCommission ?? true
      });
    }
  }, [form]);

  useEffect(() => {
    async function loadSymbols() {
      try {
        const response = await fetch("/api/symbols?assetClass=crypto");
        if (!response.ok) throw new Error("Cannot load symbols");
        const payload = (await response.json()) as { symbols: FTMOSymbolSpec[] };
        setSymbols(payload.symbols);
        const currentSymbol = form.getValues("symbol");
        if (!currentSymbol && payload.symbols[0]) {
          form.setValue("symbol", payload.symbols[0].symbol);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Cannot load symbols");
      } finally {
        setLoading(false);
      }
    }
    loadSymbols();
  }, [form]);

  const values = form.watch();
  const completeSymbols = symbols.filter((symbol) => symbol.isCompleteForCalculation);
  const visibleSymbols =
    showIncomplete || completeSymbols.length === 0 ? symbols : completeSymbols;
  const selectedSymbol = useMemo(
    () => symbols.find((symbol) => symbol.symbol === values.symbol),
    [symbols, values.symbol]
  );
  const displayedSymbols = useMemo(() => {
    if (!selectedSymbol) return visibleSymbols;
    if (visibleSymbols.some((symbol) => symbol.symbol === selectedSymbol.symbol)) {
      return visibleSymbols;
    }
    return [selectedSymbol, ...visibleSymbols];
  }, [selectedSymbol, visibleSymbols]);
  const effectiveSymbol = manualOverride ?? selectedSymbol;

  const refreshQuote = useCallback(async () => {
    if (!values.symbol || priceMode !== "market") return;

    setQuoteLoading(true);
    setQuoteError(undefined);

    try {
      const response = await fetch(`/api/quotes/${values.symbol}`);
      const payload = (await response.json()) as FTMOQuote;
      setQuote(payload);

      const marketEntry = values.direction === "long" ? payload.ask : payload.bid;
      if (marketEntry !== undefined) {
        form.setValue("entryPrice", marketEntry, { shouldValidate: true, shouldDirty: true });
      } else {
        setQuoteError("FTMO live market price is not available right now.");
      }
    } catch (loadError) {
      setQuoteError(loadError instanceof Error ? loadError.message : "Cannot load FTMO quote");
    } finally {
      setQuoteLoading(false);
    }
  }, [form, priceMode, values.direction, values.symbol]);

  const result: LotCalculationResult | undefined = useMemo(() => {
    if (!effectiveSymbol) return undefined;
    const parsed = formSchema.safeParse(values);
    if (!parsed.success) return undefined;

    return calculateLotSize(
      {
        accountBalance: parsed.data.accountBalance,
        riskMode: parsed.data.riskMode,
        riskPercent: parsed.data.riskMode === "percent" ? parsed.data.riskValue : undefined,
        riskAmount: parsed.data.riskMode === "fixed" ? parsed.data.riskValue : undefined,
        symbol: parsed.data.symbol,
        direction: parsed.data.direction,
        entryPrice: parsed.data.entryPrice,
        stopLossPrice: parsed.data.stopLossPrice,
        takeProfitPrice: parsed.data.takeProfitPrice > 0 ? parsed.data.takeProfitPrice : undefined,
        includeCommission: parsed.data.includeCommission
      },
      effectiveSymbol
    );
  }, [effectiveSymbol, values]);

  useEffect(() => {
    localStorage.setItem(
      preferenceKey,
      JSON.stringify({
        accountBalance: values.accountBalance,
        riskMode: values.riskMode,
        riskPercent: values.riskMode === "percent" ? values.riskValue : undefined,
        riskAmount: values.riskMode === "fixed" ? values.riskValue : undefined,
        lastSelectedSymbol: values.symbol,
        includeCommission: values.includeCommission,
        priceMode
      })
    );
  }, [priceMode, values]);

  useEffect(() => {
    if (priceMode !== "market" || !values.symbol) return;

    refreshQuote();
    const intervalId = window.setInterval(refreshQuote, 15000);
    return () => window.clearInterval(intervalId);
  }, [priceMode, refreshQuote, values.symbol]);

  const handleOverrideChange = useCallback((symbol: FTMOSymbolSpec | undefined) => {
    setManualOverride(symbol);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Position Size</CardTitle>
            <CardDescription>Enter trade parameters. Symbol specs are loaded from cache.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Alert>Loading symbols...</Alert> : null}
            {error ? <Alert variant="destructive">{error}</Alert> : null}
            {!loading && symbols.length === 0 ? <Alert variant="warning">No symbols available.</Alert> : null}
            {!loading && symbols.length > 0 && completeSymbols.length === 0 ? (
              <Alert variant="warning">
                No complete FTMO symbol specs are available yet. The list below falls back to incomplete placeholders until you refresh data or use manual override.
              </Alert>
            ) : null}

            <form className="mt-4 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account Balance</Label>
                  <Input type="number" step="any" {...form.register("accountBalance")} />
                </div>
                <div className="space-y-2">
                  <Label>Risk Mode</Label>
                  <Select {...form.register("riskMode")}>
                    <option value="percent">Risk %</option>
                    <option value="fixed">Risk $</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{values.riskMode === "fixed" ? "Risk $" : "Risk %"}</Label>
                  <Input type="number" step="any" {...form.register("riskValue")} />
                </div>
                <div className="space-y-2">
                  <Label>Symbol</Label>
                  <Select {...form.register("symbol")}>
                    {!values.symbol && <option value="">Select symbol</option>}
                    {displayedSymbols.map((symbol) => (
                      <option key={symbol.symbol} value={symbol.symbol}>
                        {symbol.symbol} {symbol.isCompleteForCalculation ? "" : "(incomplete)"}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select {...form.register("direction")}>
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entry Mode</Label>
                  <Select value={priceMode} onChange={(event) => setPriceMode(event.target.value as PriceMode)}>
                    <option value="manual">Manual entry</option>
                    <option value="market">Market price from FTMO</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entry Price</Label>
                  <Input
                    type="number"
                    step="any"
                    readOnly={priceMode === "market"}
                    {...form.register("entryPrice")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stop Loss Price</Label>
                  <Input type="number" step="any" {...form.register("stopLossPrice")} />
                </div>
                <div className="space-y-2">
                  <Label>Take Profit Price</Label>
                  <Input type="number" step="any" {...form.register("takeProfitPrice")} />
                </div>
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <input type="checkbox" className="h-4 w-4" {...form.register("includeCommission")} />
                  Include Commission
                </label>
              </div>

              {priceMode === "market" ? (
                <div className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-medium">FTMO Live Quote</div>
                    <Button type="button" variant="outline" size="sm" onClick={refreshQuote} disabled={quoteLoading || !values.symbol}>
                      <RefreshCcw className={`h-4 w-4 ${quoteLoading ? "animate-spin" : ""}`} />
                      Refresh quote
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Bid</div>
                      <div className="font-medium">{quote?.bid ?? "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Ask</div>
                      <div className="font-medium">{quote?.ask ?? "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Spread</div>
                      <div className="font-medium">{quote?.spread ?? "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Updated</div>
                      <div className="font-medium">{quote?.fetchedAt ?? "-"}</div>
                    </div>
                  </div>
                  {quoteError ? <Alert variant="warning" className="mt-3">{quoteError}</Alert> : null}
                  {quote?.warnings.length ? <Alert variant="warning" className="mt-3">{quote.warnings.join(" ")}</Alert> : null}
                  <div className="mt-3 text-xs text-muted-foreground">
                    Market mode uses `Ask` for long entries and `Bid` for short entries.
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant={showIncomplete ? "secondary" : "outline"} onClick={() => setShowIncomplete((current) => !current)}>
                  {showIncomplete ? "Hide incomplete symbols" : "Show incomplete symbols"}
                </Button>
                {selectedSymbol && !selectedSymbol.isCompleteForCalculation ? (
                  <span className="inline-flex items-center gap-2 text-sm text-accent">
                    <AlertTriangle className="h-4 w-4" /> Selected symbol needs manual override.
                  </span>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        {(selectedSymbol && !selectedSymbol.isCompleteForCalculation) || manualOverride ? (
          <ManualSymbolOverride symbol={selectedSymbol} onChange={handleOverrideChange} />
        ) : null}
      </div>

      <ResultPanel result={result} symbol={effectiveSymbol} />
    </div>
  );
}
