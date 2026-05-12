import type { CommissionType } from "@/types/symbol";

export function parseNumberText(value?: string): number | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!normalized) return undefined;
  const parsed = Number(normalized[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeSymbolName(value?: string): string {
  return (value ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function parseCommission(value?: string): {
  commissionType: CommissionType;
  commissionValue?: number;
} {
  if (!value || value.trim() === "") return { commissionType: "unknown" };

  const lower = value.toLowerCase();
  if (lower.includes("none") || lower.includes("free")) return { commissionType: "none", commissionValue: 0 };

  const parsed = parseNumberText(value);
  if (parsed === undefined) return { commissionType: "unknown" };

  if (value.includes("%")) {
    return { commissionType: "percent_notional", commissionValue: parsed / 100 };
  }

  return { commissionType: "fixed_per_lot", commissionValue: parsed };
}
