// filename: src/utils/marketHelpers.ts
// --- Input Sanitization & Ticker Mapping Helpers ---
// Changes:
//   1. sanitizeTicker: remove whitespace, enforce uppercase, strip invalid chars
//   2. getSymbolFromTicker: US-only fallback (no .DE/.F speculation)
//   3. validateTicker: strict regex + length check

export function sanitizeTicker(ticker: string): string {
  return ticker
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.^-]/g, '');
}

export function getSymbolFromTicker(ticker: string): string {
  // Only allow known patterns: US tickers, ^GSPC, BZ=F, CL=F, GC=F
  const sanitized = sanitizeTicker(ticker);
  if (sanitized.includes('.') || sanitized.includes('-')) {
    // EU or special — only accept if in curated list
    const allowedSpecial = ['^GSPC', 'BZ=F', 'CL=F', 'GC=F'];
    if (allowedSpecial.includes(sanitized)) return sanitized;
    // Fallback to base symbol (e.g., AMZN.DE → AMZN)
    return sanitized.split('.')[0].split('-')[0];
  }
  return sanitized;
}

export function validateTicker(ticker: string): boolean {
  const validPattern = /^[A-Z0-9.^-]+$/;
  return validPattern.test(ticker) && ticker.length <= 12;
}