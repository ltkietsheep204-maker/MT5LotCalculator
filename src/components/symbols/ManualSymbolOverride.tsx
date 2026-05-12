"use client";

import { useEffect, useState } from "react";
import type { CommissionType, FTMOSymbolSpec } from "@/types/symbol";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { validateSymbolSpec } from "@/lib/ftmo/validateSymbolSpec";

type Props = {
  symbol?: FTMOSymbolSpec;
  onChange: (symbol: FTMOSymbolSpec | undefined) => void;
};

type OverrideState = {
  contractSize?: string;
  tickSize?: string;
  tickValue?: string;
  minLot?: string;
  maxLot?: string;
  lotStep?: string;
  commissionType: CommissionType;
  commissionValue?: string;
};

const emptyState: OverrideState = { commissionType: "unknown" };

function storageKey(symbol: string) {
  return `ftmo-manual-override:${symbol}`;
}

export function ManualSymbolOverride({ symbol, onChange }: Props) {
  const [state, setState] = useState<OverrideState>(emptyState);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    const stored = localStorage.getItem(storageKey(symbol.symbol));
    if (!stored) {
      setState(emptyState);
      setActive(false);
      onChange(undefined);
      return;
    }
    const parsed = JSON.parse(stored) as OverrideState;
    setState(parsed);
    setActive(true);
  }, [symbol, onChange]);

  useEffect(() => {
    if (!symbol || !active) return;

    const toNumber = (value?: string) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && value !== "" ? parsed : undefined;
    };

    const overridden = validateSymbolSpec({
      ...symbol,
      source: "manual",
      contractSize: toNumber(state.contractSize) ?? symbol.contractSize,
      tickSize: toNumber(state.tickSize),
      tickValue: toNumber(state.tickValue),
      minLot: toNumber(state.minLot),
      maxLot: toNumber(state.maxLot),
      lotStep: toNumber(state.lotStep),
      commissionType: state.commissionType,
      commissionValue: toNumber(state.commissionValue),
      warnings: ["Manual override active"]
    });

    localStorage.setItem(storageKey(symbol.symbol), JSON.stringify(state));
    onChange(overridden);
  }, [active, state, symbol, onChange]);

  if (!symbol) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Manual Override</CardTitle>
          {active ? <Badge variant="warning">Manual override active</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning">
          Verify these values in FTMO MT5 Market Watch - Specification before live trading.
        </Alert>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["contractSize", "tickSize", "tickValue", "minLot", "maxLot", "lotStep"] as const).map((field) => (
            <div key={field} className="space-y-2">
              <Label className="capitalize">{field.replace(/([A-Z])/g, " $1")}</Label>
              <Input
                type="number"
                step="any"
                value={state[field] ?? ""}
                onChange={(event) => {
                  setActive(true);
                  setState((current) => ({ ...current, [field]: event.target.value }));
                }}
              />
            </div>
          ))}
          <div className="space-y-2">
            <Label>Commission Type</Label>
            <Select
              value={state.commissionType}
              onChange={(event) => {
                setActive(true);
                setState((current) => ({ ...current, commissionType: event.target.value as CommissionType }));
              }}
            >
              <option value="unknown">Unknown</option>
              <option value="none">None</option>
              <option value="fixed_per_lot">Fixed per lot</option>
              <option value="percent_notional">Percent notional</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Commission Value</Label>
            <Input
              type="number"
              step="any"
              value={state.commissionValue ?? ""}
              onChange={(event) => {
                setActive(true);
                setState((current) => ({ ...current, commissionValue: event.target.value }));
              }}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            localStorage.removeItem(storageKey(symbol.symbol));
            setActive(false);
            setState(emptyState);
            onChange(undefined);
          }}
        >
          Reset override
        </Button>
      </CardContent>
    </Card>
  );
}
