export type AssetClass =
  | "crypto"
  | "forex"
  | "indices"
  | "metals"
  | "commodities"
  | "stocks";

export type TradingPlatform = "MT5" | "MT4" | "cTrader" | "DXtrade" | "unknown";

export type CommissionType = "none" | "fixed_per_lot" | "percent_notional" | "unknown";

export type SymbolDataSource = "ftmo_symbols_page" | "manual" | "mt5_export" | "seed";

export type FTMOSymbolSpec = {
  symbol: string;
  displayName?: string;
  assetClass: AssetClass;
  platform: TradingPlatform;
  bidPrice?: number;
  askPrice?: number;
  spread?: number;
  contractSize?: number;
  tickSize?: number;
  tickValue?: number;
  minLot?: number;
  maxLot?: number;
  lotStep?: number;
  commissionType?: CommissionType;
  commissionValue?: number;
  commissionCurrency?: string;
  profitCurrency?: string;
  marginCurrency?: string;
  tradingHours?: string;
  source: SymbolDataSource;
  sourceUrl?: string;
  lastFetchedAt?: string;
  lastVerifiedAt?: string;
  isCompleteForCalculation: boolean;
  warnings: string[];
};

export type SymbolCacheMetadata = {
  lastFetchedAt?: string;
  source: SymbolDataSource | "cache";
  numberOfSymbols: number;
  completeSymbols: number;
  incompleteSymbols: number;
  warnings: string[];
};

export type SymbolCachePayload = {
  metadata: SymbolCacheMetadata;
  symbols: FTMOSymbolSpec[];
};

export type FTMOQuote = {
  symbol: string;
  bid?: number;
  ask?: number;
  spread?: number;
  sourceUrl: string;
  fetchedAt: string;
  warnings: string[];
};
