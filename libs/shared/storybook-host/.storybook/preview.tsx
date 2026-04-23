/**
 * Storybook global preview — decorators and parameters applied to every story.
 *
 * Wraps every story with:
 *  1. MockThemeProvider  — fixture palette + font map so useTheme() resolves
 *  2. SafeAreaProvider   — required by many RN components
 *  3. I18nProvider       — seeded with locales/en.json chrome namespace
 *
 * See design.md §D5.
 */
import React from 'react';
import type { Preview } from '@storybook/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MockThemeProvider } from '@shared/util-theme/testing';
import { I18nProvider, initI18n } from '@shared/util-i18n';

// Boot i18n once at preview load time (idempotent if called again).
// Use void to satisfy "no floating promises" lint (Storybook loads this synchronously).
void initI18n({ deviceLocale: 'en' });

const preview: Preview = {
  decorators: [
    (Story) => (
      <MockThemeProvider>
        <SafeAreaProvider>
          <I18nProvider>
            <Story />
          </I18nProvider>
        </SafeAreaProvider>
      </MockThemeProvider>
    ),
  ],

  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
    controls: {
      expanded: true,
    },
    a11y: {
      config: {
        rules: [],
      },
    },
  },
};

export default preview;
