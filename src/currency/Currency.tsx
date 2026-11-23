import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isCurrencyId, writeActiveCurrency, formatAmount, type CurrencyId } from '../domain/money';
import { loadCurrency, saveCurrency } from './storage';

type CurrencyValue = {
  id: CurrencyId;
  ready: boolean;
  setCurrency: (id: CurrencyId) => void;
};

const CurrencyContext = createContext<CurrencyValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<CurrencyId>('inr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadCurrency()
      .then((stored) => {
        writeActiveCurrency(stored);
        if (active) setId(stored);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setCurrency = useCallback((next: CurrencyId) => {
    if (!isCurrencyId(next)) return;
    writeActiveCurrency(next);
    setId(next);
    void saveCurrency(next);
  }, []);

  const value = useMemo<CurrencyValue>(() => ({ id, ready, setCurrency }), [id, ready, setCurrency]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyValue {
  const value = useContext(CurrencyContext);
  if (!value) return { id: 'inr', ready: true, setCurrency: () => undefined };
  return value;
}

export function useAmount(): (paise: number) => string {
  const { id } = useCurrency();
  return useCallback((paise: number) => formatAmount(paise, id), [id]);
}
