/**
 * Shared scoring utilities for matching a US stock symbol to its German/EU
 * listing on Yahoo Finance.
 *
 * Used by the production Vercel function (api/euquote.ts).
 * The Express dev-server (server/src/services/yahooFinance.ts) has its own
 * copy of these functions because it compiles in a separate TypeScript root
 * that can't reach api/_lib without breaking rootDir constraints.
 */

import {
  GERMAN_EXCHANGE_CODES,
  EU_SYMBOL_SUFFIXES,
} from '../../src/utils/euTickerMappings.js';

export interface GermanListingCandidate {
  symbol?: string;
  exchange?: string;
  exchDisp?: string;
  longname?: string;
  shortname?: string;
  quoteType?: string;
}

const NAME_STOPWORDS = new Set([
  'INC', 'INCORPORATED', 'CORP', 'CORPORATION', 'CO', 'COMPANY',
  'HOLDINGS', 'HOLDING', 'GROUP', 'CLASS', 'ADR', 'PLC',
  'SA', 'SE', 'AG', 'NV', 'THE', 'A', 'B',
]);

export function normalizeCompanyName(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

export function tokenizeCompanyName(value: string): string[] {
  return normalizeCompanyName(value)
    .split(' ')
    .filter((token) => token.length > 1 && !NAME_STOPWORDS.has(token) && !/^\d+$/.test(token));
}

export function isGermanListingCandidate(result: GermanListingCandidate): boolean {
  const symbol = String(result.symbol ?? '').toUpperCase();
  const exchange = String(result.exchange ?? result.exchDisp ?? '').toUpperCase();

  return (
    EU_SYMBOL_SUFFIXES.some((suffix) => symbol.endsWith(suffix)) &&
    (!exchange || GERMAN_EXCHANGE_CODES.includes(exchange as (typeof GERMAN_EXCHANGE_CODES)[number]))
  );
}

export function scoreGermanListingCandidate(
  result: GermanListingCandidate,
  referenceNames: string[],
): { score: number; sharedCount: number; overlap: number; exactMatch: boolean } {
  const candidateName = String(result.longname ?? result.shortname ?? '').trim();

  if (!candidateName) {
    return { score: -1, sharedCount: 0, overlap: 0, exactMatch: false };
  }

  const normalizedReferenceNames = new Set(
    referenceNames.map((name) => normalizeCompanyName(name)).filter(Boolean),
  );
  const normalizedCandidateName = normalizeCompanyName(candidateName);
  const exactMatch = normalizedReferenceNames.has(normalizedCandidateName);
  const referenceTokens = Array.from(
    new Set(referenceNames.flatMap((name) => tokenizeCompanyName(name))),
  );
  const candidateTokens = Array.from(new Set(tokenizeCompanyName(candidateName)));
  const referenceTokenSet = new Set(referenceTokens);
  const sharedCount = candidateTokens.filter((token) => referenceTokenSet.has(token)).length;
  const overlap = referenceTokens.length ? sharedCount / referenceTokens.length : 0;
  const exchange = String(result.exchange ?? result.exchDisp ?? '').toUpperCase();
  const quoteType = String(result.quoteType ?? '').toUpperCase();
  let score = overlap * 6;

  if (exactMatch) score += 8;
  if (sharedCount >= 2) score += 2;
  if (exchange === 'XETRA' || exchange === 'GER') score += 1;
  if (quoteType === 'EQUITY' || quoteType === 'ETF') score += 0.5;

  return { score, sharedCount, overlap, exactMatch };
}
