import { PAISE_PER_RUPEE } from '../constants';

export const CURRENCY_IDS = ['inr', 'usd', 'aed'] as const;
export type CurrencyId = (typeof CURRENCY_IDS)[number];

export function isCurrencyId(value: string | null | undefined): value is CurrencyId {
  return value === 'inr' || value === 'usd' || value === 'aed';
}

const SYMBOL: Record<CurrencyId, string> = {
  inr: '₹',
  usd: '$',
  aed: 'AED ',
};

export function formatAmount(paise: number, currency: CurrencyId): string {
  const negative = paise < 0;
  const absolute = Math.abs(paise);
  const major = Math.trunc(absolute / PAISE_PER_RUPEE);
  const fraction = absolute % PAISE_PER_RUPEE;
  const grouped = currency === 'inr' ? groupIndian(String(major)) : groupWestern(String(major));
  const body = fraction === 0 ? grouped : `${grouped}.${String(fraction).padStart(2, '0')}`;
  return `${negative ? '-' : ''}${SYMBOL[currency]}${body}`;
}

function groupIndian(whole: string): string {
  if (whole.length <= 3) return whole;
  const head = whole.slice(0, -3);
  const tail = whole.slice(-3);
  return `${head.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${tail}`;
}

function groupWestern(whole: string): string {
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
