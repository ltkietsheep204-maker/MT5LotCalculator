import type { CommissionType } from "@/types/symbol";

type CommissionInput = {
  lot: number;
  contractSize?: number;
  entryPrice: number;
  commissionType?: CommissionType;
  commissionValue?: number;
};

export function calculateCommission({
  lot,
  contractSize,
  entryPrice,
  commissionType = "none",
  commissionValue = 0
}: CommissionInput): number {
  if (lot <= 0 || commissionValue <= 0 || commissionType === "none") {
    return 0;
  }

  if (commissionType === "fixed_per_lot") {
    return lot * commissionValue;
  }

  if (commissionType === "percent_notional") {
    if (!contractSize || contractSize <= 0 || entryPrice <= 0) {
      return 0;
    }

    const notional = lot * contractSize * entryPrice;
    return notional * commissionValue * 2;
  }

  return 0;
}
