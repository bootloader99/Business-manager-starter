

export function formatCurrency(
  amountMinor: number,
  currencySymbol = '₹',
  decimalPlaces = 2,
): string {
  const amount = amountMinor / Math.pow(10, decimalPlaces);

  return `${currencySymbol}${amount.toFixed(decimalPlaces)}`;
}