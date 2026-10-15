/**
 * Static-export HTML shell (web only; Expo Router `+html`).
 *
 * Same head as Expo's default template, plus the PWA manifest link and
 * theme-color (#47, design D4). Hrefs are prefixed with the build's base URL
 * (EXPO_BASE_URL, inlined by babel-preset-expo from experiments.baseUrl) so
 * they resolve under GitHub Pages sub-paths (ADR-011) on every route.
 *
 * <title> and <html lang> come from the per-pack manifest written by
 * tools/generate-lang-manifest.ts (yue → 學廣話 / zh-HK; eng → AlphaTiles / en),
 * so CJK glyph selection, screen-reader voice and the tab name follow the pack.
 */
import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
import webManifest from '../public/manifest.json';

const BASE_URL = process.env.EXPO_BASE_URL ?? '';
// Keep in sync with public/manifest.json theme_color (palette[0]).
const THEME_COLOR = '#9C27B0';
const TITLE_SCRIPT = `if(!document.title)document.title=${JSON.stringify(webManifest.name)};`;

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang={webManifest.lang}>
      <head>
        <meta charSet="utf-8" />
        <title>{webManifest.name}</title>
        <meta name="application-name" content={webManifest.name} />
        <meta name="apple-mobile-web-app-title" content={webManifest.short_name} />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content={THEME_COLOR} />
        <link rel="manifest" href={`${BASE_URL}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${BASE_URL}/icons/icon-192.png`} />
        {/* expo-router's static head (react-helmet) emits an empty <title> ahead of
            ours, and document.title reads the first one: copy the pack name in. */}
        <script dangerouslySetInnerHTML={{ __html: TITLE_SCRIPT }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
