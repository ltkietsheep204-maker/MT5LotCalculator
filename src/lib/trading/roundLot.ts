export function roundLotDown(rawLot: number, lotStep: number): number {
  if (!Number.isFinite(rawLot) || !Number.isFinite(lotStep) || lotStep <= 0) {
    return 0;
  }

  const precision = Math.max(0, (lotStep.toString().split(".")[1] ?? "").length);
  const scale = 10 ** Math.min(precision + 4, 12);
  const rawScaled = Math.floor(rawLot * scale);
  const stepScaled = Math.round(lotStep * scale);
  const roundedScaled = Math.floor(rawScaled / stepScaled) * stepScaled;

  return Number((roundedScaled / scale).toFixed(precision));
}

export function clampLot(lot: number, minLot: number, maxLot: number): number {
  return Math.min(Math.max(lot, minLot), maxLot);
}
