import "@formatjs/intl-pluralrules/polyfill.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";
import { createIntl, createIntlCache } from "react-intl";
import en from "./en.json" with { type: "json" };

export type MessageId = keyof typeof en;

const cache = createIntlCache();

export const intl = createIntl(
  {
    locale: "en",
    defaultLocale: "en",
    messages: en,
  },
  cache,
);

export function t(
  id: MessageId,
  values?: Record<string, string | number>,
): string {
  return intl.formatMessage({ id }, values);
}
