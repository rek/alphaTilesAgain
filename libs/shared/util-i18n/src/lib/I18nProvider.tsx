/**
 * I18nProvider — thin wrapper over react-i18next's I18nextProvider.
 *
 * Pre-binds the singleton i18next instance so consumers don't import the
 * singleton directly. This is the ONLY react-i18next provider in the app;
 * mount it in apps/alphaTiles/app/_layout.tsx. Implements design.md §5.1.
 */

import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from './i18nInstance';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps): React.JSX.Element {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
