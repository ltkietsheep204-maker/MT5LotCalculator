import type { FTMOSymbolSpec, TradingPlatform } from "@/types/symbol";
import type { RawFTMOSymbolRecord } from "./scrapeFTMOSymbols";
import { normalizeSymbolName, parseCommission, parseNumberText } from "./parseFTMOSymbols";
import { validateSymbolSpec } from "./validateSymbolSpec";

const CRYPTO_PREFIXES = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "LTC", "BNB", "DOT", "LINK"];

function normalizePlatform(platform?: string): TradingPlatform {
  const normalized = (platform ?? "").toLowerCase();
  if (normalized.includes("mt5")) return "MT5";
  if (normalized.includes("mt4")) return "MT4";
  if (normalized.includes("ctrader")) return "cTrader";
  if (normalized.includes("dxtrade")) return "DXtrade";
  return "unknown";
}

export function normalizeFTMOSymbol(raw: RawFTMOSymbolRecord): FTMOSymbolSpec {
  const symbol = normalizeSymbolName(raw.symbol ?? raw.displayName);
  const isCrypto = CRYPTO_PREFIXES.some((prefix) => symbol.startsWith(prefix)) || raw.assetClass?.toLowerCase() === "crypto";
  const commission = parseCommission(raw.rawCommission);

  return validateSymbolSpec({
    symbol,
    displayName: raw.displayName ?? symbol,
    assetClass: isCrypto ? "crypto" : "forex",
    platform: normalizePlatform(raw.platform),
    bidPrice: parseNumberText(raw.rawBidPrice),
    askPrice: parseNumberText(raw.rawAskPrice),
    spread: parseNumberText(raw.rawSpread),
    contractSize: parseNumberText(raw.rawContractSize),
    tickSize: parseNumberText(raw.rawTickSize),
    tickValue: parseNumberText(raw.rawTickValue),
    minLot: parseNumberText(raw.rawMinLot),
    maxLot: parseNumberText(raw.rawMaxLot),
    lotStep: parseNumberText(raw.rawLotStep),
    commissionType: commission.commissionType,
    commissionValue: commission.commissionValue,
    tradingHours: raw.rawTradingHours,
    source: "ftmo_symbols_page",
    sourceUrl: raw.sourceUrl,
    lastFetchedAt: raw.fetchedAt,
    isCompleteForCalculation: false,
    warnings: raw.warnings
  });
}
