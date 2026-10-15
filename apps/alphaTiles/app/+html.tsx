/**
 * Static-export HTML shell (web only; Expo Router `+html`).
 *
 * Same head as Expo's default template, plus the PWA manifest link and
 * theme-color (#47, design D4). manifest.json name/lang/Play id are rewritten
 * per pack after export (tools/write-web-manifest.ts). Hrefs are prefixed with the build's base URL
 * (EXPO_BASE_URL, inlined by babel-preset-expo from experiments.baseUrl) so
 * they resolve under GitHub Pages sub-paths (ADR-011) on every route.
 */
import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

const BASE_URL = process.env.EXPO_BASE_URL ?? '';
// Keep in sync with public/manifest.json theme_color (palette[0]).
const THEME_COLOR = '#9C27B0';
// Pack language: APP_LANG (pack folder = ethnologue code) as canonical BCP-47
// (eng → en). Static render runs in the export process, so env is readable here.
const HTML_LANG = ((code: string | undefined): string => {
  try {
    return (code && Intl.getCanonicalLocales(code)[0]) || 'en';
  } catch {
    return 'en';
  }
})(process.env.APP_LANG);

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang={HTML_LANG}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content={THEME_COLOR} />
        <link rel="manifest" href={`${BASE_URL}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${BASE_URL}/icons/icon-192.png`} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
