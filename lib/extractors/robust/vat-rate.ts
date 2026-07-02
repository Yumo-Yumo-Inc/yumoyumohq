export function snapVatRate(rate: number): number | undefined {
  const validVatRates = [0, 0.01, 0.10, 0.20];
  const closest = validVatRates.reduce((a, b) =>
    Math.abs(a - rate) < Math.abs(b - rate) ? a : b
  );
  return Math.abs(closest - rate) < 0.005 ? closest : undefined;
}
