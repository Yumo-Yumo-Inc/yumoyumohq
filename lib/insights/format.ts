/**
 * Currency formatting utilities for insights
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  TRY: "₺",
  THB: "฿",
  EUR: "€",
  GBP: "£",
};

/**
 * Format currency amount with symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  
  // For non-standard currencies, try Intl.NumberFormat
  if (!CURRENCY_SYMBOLS[currency]) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // Fallback if currency code is invalid
      return `${symbol}${amount.toFixed(2)}`;
    }
  }
  
  // Format with symbol
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format currency amount compact (for charts)
 */
export function formatCurrencyCompact(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  
  if (amount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}k`;
  }
  
  return formatCurrency(amount, currency);
}





