import type { FTMOSymbolSpec } from "@/types/symbol";

function supportsDirectCryptoCalculation(spec: FTMOSymbolSpec) {
  return (
    spec.assetClass === "crypto" &&
    !!spec.contractSize &&
    spec.contractSize > 0 &&
    !!spec.lotStep &&
    spec.lotStep > 0 &&
    !!spec.minLot &&
    spec.minLot > 0 &&
    !!spec.maxLot &&
    spec.maxLot >= spec.minLot
  );
}

export function validateSymbolSpec(spec: FTMOSymbolSpec): FTMOSymbolSpec {
  const warnings = new Set(spec.warnings);
  const hasDirectModel = supportsDirectCryptoCalculation(spec);

  if (!hasDirectModel && (!spec.tickSize || spec.tickSize <= 0)) warnings.add("Missing tick size");
  if (!hasDirectModel && (!spec.tickValue || spec.tickValue <= 0)) warnings.add("Missing tick value");
  if (!spec.lotStep || spec.lotStep <= 0) warnings.add("Missing lot step");
  if (!spec.minLot || spec.minLot <= 0) warnings.add("Missing min lot");
  if (!spec.maxLot || spec.maxLot <= 0 || (spec.minLot !== undefined && spec.maxLot < spec.minLot)) {
    warnings.add("Missing max lot");
  }

  const isCompleteForCalculation =
    hasDirectModel ||
    (!!spec.tickSize &&
      spec.tickSize > 0 &&
      !!spec.tickValue &&
      spec.tickValue > 0 &&
      !!spec.lotStep &&
      spec.lotStep > 0 &&
      !!spec.minLot &&
      spec.minLot > 0 &&
      !!spec.maxLot &&
      spec.maxLot >= spec.minLot);

  return {
    ...spec,
    isCompleteForCalculation,
    warnings: Array.from(warnings)
  };
}
