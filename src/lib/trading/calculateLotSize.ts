import type { LotCalculationInput, LotCalculationResult } from "@/types/calculator";
import type { FTMOSymbolSpec } from "@/types/symbol";
import { calculateCommission } from "./calculateCommission";
import { clampLot, roundLotDown } from "./roundLot";

const PERCENTAGE_SWAP_RATES: Record<string, number> = {
  BTCUSD: -30,
  ETHUSD: -30,
  SOLUSD: -30
};

function calculateOvernightSwap(symbol: string, lot: number, contractSize: number | undefined, entryPrice: number) {
  const swapRate = PERCENTAGE_SWAP_RATES[symbol];
  if (!swapRate || lot <= 0 || !contractSize || contractSize <= 0 || entryPrice <= 0) {
    return 0;
  }

  const notional = lot * contractSize * entryPrice;
  return (notional * swapRate) / 100 / 360;
}

function requirePositive(value: number | undefined, warning: string, warnings: string[]) {
  if (value === undefined || value === null || !Number.isFinite(value) || value <= 0) {
    warnings.push(warning);
    return false;
  }
  return true;
}

export function calculateLotSize(
  input: LotCalculationInput,
  symbolSpec: FTMOSymbolSpec
): LotCalculationResult {
  const warnings: string[] = [...symbolSpec.warnings];
  const supportsDirectCryptoCalculation =
    symbolSpec.assetClass === "crypto" &&
    !!symbolSpec.contractSize &&
    symbolSpec.contractSize > 0;

  if (input.accountBalance <= 0) warnings.push("Account balance must be greater than 0");
  if (input.entryPrice <= 0) warnings.push("Entry price must be greater than 0");
  if (input.stopLossPrice <= 0) warnings.push("Stop loss price must be greater than 0");
  if (input.entryPrice === input.stopLossPrice) warnings.push("Entry price and stop loss cannot be equal");
  if (input.direction === "long" && input.stopLossPrice >= input.entryPrice) {
    warnings.push("Stop loss direction does not match trade direction");
  }
  if (input.direction === "short" && input.stopLossPrice <= input.entryPrice) {
    warnings.push("Stop loss direction does not match trade direction");
  }

  const riskAmount =
    input.riskMode === "fixed"
      ? input.riskAmount ?? 0
      : input.accountBalance * ((input.riskPercent ?? 0) / 100);

  if (riskAmount <= 0) warnings.push("Risk amount must be greater than 0");

  const hasRequiredSpec = [
    requirePositive(symbolSpec.lotStep, "Missing lot step", warnings),
    requirePositive(symbolSpec.minLot, "Missing min lot", warnings),
    requirePositive(symbolSpec.maxLot, "Missing max lot", warnings)
  ];

  if (supportsDirectCryptoCalculation) {
    hasRequiredSpec.push(requirePositive(symbolSpec.contractSize, "Missing contract size", warnings));
  } else {
    hasRequiredSpec.push(requirePositive(symbolSpec.tickSize, "Missing tick size", warnings));
    hasRequiredSpec.push(requirePositive(symbolSpec.tickValue, "Missing tick value", warnings));
  }

  const hasCompleteRequiredSpec = hasRequiredSpec.every(Boolean);

  if (!symbolSpec.isCompleteForCalculation || !hasCompleteRequiredSpec) {
    warnings.push("Symbol specification is incomplete");
  }

  if (
    !hasCompleteRequiredSpec ||
    warnings.some((warning) =>
      [
        "Account balance must be greater than 0",
        "Entry price must be greater than 0",
        "Stop loss price must be greater than 0",
        "Entry price and stop loss cannot be equal",
        "Stop loss direction does not match trade direction",
        "Risk amount must be greater than 0"
      ].includes(warning)
    )
  ) {
    return {
      symbol: input.symbol,
      riskAmount,
      priceDistance: 0,
      ticksCount: 0,
      lossPerOneLot: 0,
      rawLot: 0,
      roundedLot: 0,
      finalLot: 0,
      estimatedLoss: 0,
      estimatedCommission: 0,
      totalEstimatedRisk: 0,
      effectiveRiskPercent: 0,
      estimatedProfitAtTp: 0,
      estimatedOvernightSwap: 0,
      riskRewardRatio: undefined,
      minimumExecutableLot: symbolSpec.minLot,
      minimumLotRisk: undefined,
      warnings: Array.from(new Set(warnings))
    };
  }

  const lotStep = symbolSpec.lotStep as number;
  const minLot = symbolSpec.minLot as number;
  const maxLot = symbolSpec.maxLot as number;

  if (maxLot < minLot) {
    warnings.push("Missing max lot");
    warnings.push("Symbol specification is incomplete");
  }

  const priceDistance = Math.abs(input.entryPrice - input.stopLossPrice);
  const ticksCount = supportsDirectCryptoCalculation ? 0 : priceDistance / (symbolSpec.tickSize as number);
  const lossPerOneLot = supportsDirectCryptoCalculation
    ? priceDistance * (symbolSpec.contractSize as number)
    : ticksCount * (symbolSpec.tickValue as number);
  const commissionType = symbolSpec.commissionType ?? "none";
  const commissionValue = symbolSpec.commissionValue ?? 0;

  if (input.includeCommission && commissionType === "unknown") {
    warnings.push("Commission is unknown");
  }

  const oneLotCommission =
    input.includeCommission && commissionType === "fixed_per_lot" ? commissionValue : 0;
  const rawLot = riskAmount / (lossPerOneLot + oneLotCommission);
  const roundedLot = roundLotDown(rawLot, lotStep);

  if (roundedLot < minLot) warnings.push("Calculated lot is below min lot");
  if (roundedLot > maxLot) warnings.push("Calculated lot is above max lot");

  let finalLot = roundLotDown(clampLot(roundedLot, minLot, maxLot), lotStep);
  const minimumLotCommission = input.includeCommission
    ? calculateCommission({
        lot: minLot,
        contractSize: symbolSpec.contractSize,
        entryPrice: input.entryPrice,
        commissionType,
        commissionValue
      })
    : 0;
  const minimumLotRisk = minLot * lossPerOneLot + minimumLotCommission;
  let estimatedLoss = finalLot * lossPerOneLot;
  let estimatedCommission = input.includeCommission
    ? calculateCommission({
        lot: finalLot,
        contractSize: symbolSpec.contractSize,
        entryPrice: input.entryPrice,
        commissionType,
        commissionValue
      })
    : 0;
  let totalEstimatedRisk = estimatedLoss + estimatedCommission;

  while (finalLot > 0 && totalEstimatedRisk > riskAmount) {
    finalLot = roundLotDown(finalLot - lotStep, lotStep);
    estimatedLoss = finalLot * lossPerOneLot;
    estimatedCommission = input.includeCommission
      ? calculateCommission({
          lot: finalLot,
          contractSize: symbolSpec.contractSize,
          entryPrice: input.entryPrice,
          commissionType,
          commissionValue
        })
      : 0;
    totalEstimatedRisk = estimatedLoss + estimatedCommission;
  }

  if (finalLot === 0 && minimumLotRisk > riskAmount) {
    warnings.push(
      `Minimum executable lot ${minLot} requires about $${minimumLotRisk.toFixed(2)} risk with the current entry, stop loss, and commission settings`
    );
  }

  if (totalEstimatedRisk < riskAmount) {
    warnings.push("Estimated risk is lower than intended risk because lot was rounded down");
  }
  if (totalEstimatedRisk > riskAmount) warnings.push("Estimated total risk exceeds intended risk");

  const takeProfitDistance =
    input.takeProfitPrice && input.takeProfitPrice > 0
      ? Math.abs(input.takeProfitPrice - input.entryPrice)
      : 0;
  const estimatedProfitAtTp = takeProfitDistance > 0
    ? finalLot * takeProfitDistance * ((symbolSpec.contractSize as number | undefined) ?? 0)
    : 0;
  const estimatedOvernightSwap = calculateOvernightSwap(
    input.symbol,
    finalLot,
    symbolSpec.contractSize,
    input.entryPrice
  );
  const riskRewardRatio =
    totalEstimatedRisk > 0 && estimatedProfitAtTp > 0 ? estimatedProfitAtTp / totalEstimatedRisk : undefined;

  return {
    symbol: input.symbol,
    riskAmount,
    priceDistance,
    ticksCount,
    lossPerOneLot,
    rawLot,
    roundedLot,
    finalLot,
    estimatedLoss,
    estimatedCommission,
    totalEstimatedRisk,
    effectiveRiskPercent: input.accountBalance > 0 ? (totalEstimatedRisk / input.accountBalance) * 100 : 0,
    estimatedProfitAtTp,
    estimatedOvernightSwap,
    riskRewardRatio,
    minimumExecutableLot: minLot,
    minimumLotRisk,
    warnings: Array.from(new Set(warnings))
  };
}
