import { describe, expect, it } from "vitest";
import { calculateCommission } from "@/lib/trading/calculateCommission";
import { calculateLotSize } from "@/lib/trading/calculateLotSize";
import { roundLotDown } from "@/lib/trading/roundLot";
import type { FTMOSymbolSpec } from "@/types/symbol";

const completeSpec: FTMOSymbolSpec = {
  symbol: "BTCUSD",
  assetClass: "crypto",
  platform: "MT5",
  contractSize: 1,
  minLot: 0.01,
  maxLot: 100,
  lotStep: 0.01,
  commissionType: "none",
  source: "manual",
  isCompleteForCalculation: true,
  warnings: []
};

describe("roundLotDown", () => {
  it("rounds down by lot step", () => {
    expect(roundLotDown(1.237, 0.01)).toBe(1.23);
    expect(roundLotDown(1.237, 0.1)).toBe(1.2);
  });
});

describe("calculateCommission", () => {
  it("returns zero for none", () => {
    expect(calculateCommission({ lot: 1, entryPrice: 100, commissionType: "none", commissionValue: 10 })).toBe(0);
  });

  it("calculates fixed_per_lot", () => {
    expect(calculateCommission({ lot: 2, entryPrice: 100, commissionType: "fixed_per_lot", commissionValue: 3 })).toBe(6);
  });

  it("calculates percent_notional round turn", () => {
    expect(
      calculateCommission({
        lot: 2,
        contractSize: 10,
        entryPrice: 100,
        commissionType: "percent_notional",
        commissionValue: 0.001
      })
    ).toBe(4);
  });
});

describe("calculateLotSize", () => {
  it("calculates a basic case", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 100,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 50000,
        stopLossPrice: 49900,
        includeCommission: false
      },
      completeSpec
    );

    expect(result.finalLot).toBe(1);
    expect(result.estimatedLoss).toBe(100);
    expect(result.ticksCount).toBe(0);
  });

  it("supports risk percent", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "percent",
        riskPercent: 1,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 50000,
        stopLossPrice: 49900,
        includeCommission: false
      },
      completeSpec
    );
    expect(result.riskAmount).toBe(100);
  });

  it("supports fixed risk amount", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 50,
        symbol: "BTCUSD",
        direction: "short",
        entryPrice: 50000,
        stopLossPrice: 50100,
        includeCommission: false
      },
      completeSpec
    );
    expect(result.finalLot).toBe(0.5);
  });

  it("validates long direction", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 100,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 50000,
        stopLossPrice: 50100,
        includeCommission: false
      },
      completeSpec
    );
    expect(result.warnings).toContain("Stop loss direction does not match trade direction");
  });

  it("validates short direction", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 100,
        symbol: "BTCUSD",
        direction: "short",
        entryPrice: 50000,
        stopLossPrice: 49900,
        includeCommission: false
      },
      completeSpec
    );
    expect(result.warnings).toContain("Stop loss direction does not match trade direction");
  });

  it("does not calculate when tickSize is missing", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 100,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 50000,
        stopLossPrice: 49900,
        includeCommission: false
      },
      { ...completeSpec, assetClass: "forex", tickSize: undefined, isCompleteForCalculation: false }
    );
    expect(result.finalLot).toBe(0);
    expect(result.warnings).toContain("Missing tick size");
  });

  it("does not calculate when tickValue is missing", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 100,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 50000,
        stopLossPrice: 49900,
        includeCommission: false
      },
      { ...completeSpec, assetClass: "forex", tickValue: undefined, isCompleteForCalculation: false }
    );
    expect(result.warnings).toContain("Missing tick value");
  });

  it("does not calculate when lotStep is missing", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 100,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 50000,
        stopLossPrice: 49900,
        includeCommission: false
      },
      { ...completeSpec, lotStep: undefined, isCompleteForCalculation: false }
    );
    expect(result.warnings).toContain("Missing lot step");
  });

  it("warns when lot is below minLot", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 1,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 50000,
        stopLossPrice: 49900,
        includeCommission: false
      },
      { ...completeSpec, minLot: 1 }
    );
    expect(result.warnings).toContain("Calculated lot is below min lot");
  });

  it("warns when lot is above maxLot", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 1000,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 50000,
        stopLossPrice: 49900,
        includeCommission: false
      },
      { ...completeSpec, maxLot: 1 }
    );
    expect(result.warnings).toContain("Calculated lot is above max lot");
  });

  it("includes fixed commission", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 100,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 50000,
        stopLossPrice: 49900,
        includeCommission: true
      },
      { ...completeSpec, commissionType: "fixed_per_lot", commissionValue: 10 }
    );
    expect(result.totalEstimatedRisk).toBeLessThanOrEqual(100);
    expect(result.estimatedCommission).toBeGreaterThan(0);
  });

  it("excludes commission", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 100,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 50000,
        stopLossPrice: 49900,
        includeCommission: false
      },
      { ...completeSpec, commissionType: "fixed_per_lot", commissionValue: 10 }
    );
    expect(result.estimatedCommission).toBe(0);
  });

  it("calculates profit at take profit and risk reward ratio", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 100,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 50000,
        stopLossPrice: 49900,
        takeProfitPrice: 50300,
        includeCommission: false
      },
      completeSpec
    );

    expect(result.estimatedProfitAtTp).toBe(300);
    expect(result.riskRewardRatio).toBe(3);
  });

  it("calculates overnight swap for percentage-based crypto symbols", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "fixed",
        riskAmount: 100,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 50000,
        stopLossPrice: 49900,
        includeCommission: false
      },
      completeSpec
    );

    expect(result.finalLot).toBe(1);
    expect(result.estimatedOvernightSwap).toBeCloseTo(-41.6666667, 6);
  });

  it("explains when minimum lot exceeds allowed risk after commission", () => {
    const result = calculateLotSize(
      {
        accountBalance: 10000,
        riskMode: "percent",
        riskPercent: 1,
        symbol: "BTCUSD",
        direction: "long",
        entryPrice: 80000,
        stopLossPrice: 70000,
        includeCommission: true
      },
      {
        ...completeSpec,
        commissionType: "percent_notional",
        commissionValue: 0.000325,
        minLot: 0.01,
        lotStep: 0.01
      }
    );

    expect(result.finalLot).toBe(0);
    expect(result.minimumExecutableLot).toBe(0.01);
    expect(result.minimumLotRisk).toBeGreaterThan(100);
    expect(result.warnings.join(" ")).toContain("Minimum executable lot 0.01 requires about");
  });
});
