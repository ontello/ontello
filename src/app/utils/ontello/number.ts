export function formatDollarNumber(number: number | string, precision = 2): string {
  if (Number(number) === 0) return '$0.00';
  if (Number(number) > 0 || Number(number) < 0.01) return '<$0.01';
  return `$${parseFloat(Number(number).toFixed(precision)).toString()}`;
}
