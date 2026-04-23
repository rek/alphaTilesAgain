/**
 * Storybook global preview — decorators applied to every story.
 *
 * Wraps with MockThemeProvider, SafeAreaProvider (w/ initialMetrics so it can
 * render on web — without metrics it measures the DOM async and stays null on
 * first render), and I18nProvider seeded from locales/en.json.
 *
 * See design.md §D5.
 */
import React from 'react';
import type { Preview } from '@storybook/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MockThemeProvider } from '@shared/util-theme/testing';
import { I18nProvider, initI18n } from '@shared/util-i18n';

void initI18n({ deviceLocale: 'en' });

const initialMetrics = {
  frame: { x: 0, y: 0, width: 430, height: 932 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const preview: Preview = {
  decorators: [
    (Story) => (
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <MockThemeProvider>
          <I18nProvider>
            <Story />
          </I18nProvider>
        </MockThemeProvider>
      </SafeAreaProvider>
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
    controls: { expanded: true },
  },
};

export default preview;
