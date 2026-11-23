import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import { useCallback, type ReactNode } from 'react';
import { IntlProvider, useIntl } from 'react-intl';
import en from './en.json';
import { type MessageId } from './messages';

export { intl, t, type MessageId } from './messages';

export function useText() {
  const reactIntl = useIntl();
  return useCallback(
    (id: MessageId, values?: Record<string, string | number>) => reactIntl.formatMessage({ id }, values),
    [reactIntl],
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  return (
    <IntlProvider locale="en" defaultLocale="en" messages={en}>
      {children}
    </IntlProvider>
  );
}
