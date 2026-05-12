export type Direction = "long" | "short";

export type RiskMode = "percent" | "fixed";

export type LotCalculationInput = {
  accountBalance: number;
  riskMode: RiskMode;
  riskPercent?: number;
  riskAmount?: number;
  symbol: string;
  direction: Direction;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  includeCommission: boolean;
};

export type LotCalculationResult = {
  symbol: string;
  riskAmount: number;
  priceDistance: number;
  ticksCount: number;
  lossPerOneLot: number;
  rawLot: number;
  roundedLot: number;
  finalLot: number;
  estimatedLoss: number;
  estimatedCommission: number;
  totalEstimatedRisk: number;
  effectiveRiskPercent: number;
  estimatedProfitAtTp: number;
  riskRewardRatio?: number;
  minimumExecutableLot?: number;
  minimumLotRisk?: number;
  warnings: string[];
};
