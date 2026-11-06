export type CurrencyCode =
  | 'BRL'
  | 'AOA'
  | 'EUR'
  | 'USD'
  | 'CDF';

export interface CurrencyConfig {
  code: CurrencyCode;
  country: string;
  symbol: string;
  flag: string;
  rateFromKz: number; // multiplier from base Kz
  prefix: boolean;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  BRL: {
    code: 'BRL',
    country: 'Brasil',
    symbol: 'R$',
    flag: '🇧🇷',
    rateFromKz: 0.0055, // 1 BRL ≈ 181.8 Kz
    prefix: true,
    locale: 'pt-BR'
  },
  AOA: {
    code: 'AOA',
    country: 'Angola',
    symbol: 'Kz',
    flag: '🇦🇴',
    rateFromKz: 1,
    prefix: false,
    locale: 'pt-AO'
  },
  EUR: {
    code: 'EUR',
    country: 'Portugal',
    symbol: '€',
    flag: '🇵🇹',
    rateFromKz: 0.0010, // 1 EUR ≈ 1000 Kz
    prefix: true,
    locale: 'pt-PT'
  },
  USD: {
    code: 'USD',
    country: 'EUA',
    symbol: '$',
    flag: '🇺🇸',
    rateFromKz: 0.0011, // 1 USD ≈ 909 Kz
    prefix: true,
    locale: 'en-US'
  },
  CDF: {
    code: 'CDF',
    country: 'Congo',
    symbol: 'FC',
    flag: '🇨🇩',
    rateFromKz: 3.12, // 1 Kz ≈ 3.12 FC
    prefix: false,
    locale: 'fr-CD'
  }
};

export const CURRENCY_EVENT = 'baba_currency_change';

// Fast cached number formatters for instantaneous 0ms calculation
const numberFormatterCache: Record<string, Intl.NumberFormat> = {};

function getCachedFormatter(locale: string): Intl.NumberFormat {
  if (!numberFormatterCache[locale]) {
    try {
      numberFormatterCache[locale] = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch {
      numberFormatterCache[locale] = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }
  return numberFormatterCache[locale];
}

// In-memory active currency for synchronous microsecond access (default Brasil)
let currentActiveCurrency: CurrencyCode = 'BRL';

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('baba_selected_currency') as CurrencyCode;
  if (saved && CURRENCIES[saved]) {
    currentActiveCurrency = saved;
  } else {
    currentActiveCurrency = 'BRL';
  }
}

export function getActiveCurrency(): CurrencyCode {
  return currentActiveCurrency;
}

export function setActiveCurrency(code: CurrencyCode): void {
  if (!CURRENCIES[code] || currentActiveCurrency === code) return;
  currentActiveCurrency = code;
  if (typeof window !== 'undefined') {
    localStorage.setItem('baba_selected_currency', code);
    window.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: code }));
  }
}

/**
 * Ultra-fast synchronous currency formatter (< 0.01ms per call)
 */
export function formatMoney(amountInKz: number, overrideCode?: CurrencyCode): string {
  const code = overrideCode || currentActiveCurrency;
  const cfg = CURRENCIES[code] || CURRENCIES.BRL;
  const converted = (amountInKz || 0) * cfg.rateFromKz;
  const formatted = getCachedFormatter(cfg.locale).format(converted);
  return cfg.prefix ? `${cfg.symbol} ${formatted}` : `${formatted} ${cfg.symbol}`;
}
