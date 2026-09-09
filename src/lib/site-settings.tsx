/**
 * Frontend access to site settings. The root route loads them on the server
 * and provides them here, so every page renders admin-configured content
 * during SSR without a loading flash.
 */
import { createContext, useContext, type ReactNode } from "react";

import { setCurrencySymbol } from "./cart";
import { DEFAULT_SETTINGS, currencySymbol, type SiteSettings } from "./settings";

const SettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettings | undefined;
  children: ReactNode;
}) {
  const value = settings ?? DEFAULT_SETTINGS;
  // Keeps the shared price formatter in sync with the configured currency.
  setCurrencySymbol(currencySymbol(value.general.currency_code));
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SiteSettings {
  return useContext(SettingsContext);
}
