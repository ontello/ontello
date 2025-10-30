export function formatPrecision(number: number | string, precision = 5): string {
  return parseFloat(Number(number).toFixed(precision)).toString();
}
