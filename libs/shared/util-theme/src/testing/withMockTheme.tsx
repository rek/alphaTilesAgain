/**
 * Storybook decorator that wraps stories in <MockThemeProvider>.
 *
 * Usage in a .stories.tsx file:
 *   import { withMockTheme } from '@shared/util-theme/testing';
 *   export const decorators = [withMockTheme];
 *
 * See tasks.md §8.1.
 */
import React from 'react';
import { MockThemeProvider } from './MockThemeProvider';

export function withMockTheme(Story: () => React.JSX.Element): React.JSX.Element {
  return (
    <MockThemeProvider>
      <Story />
    </MockThemeProvider>
  );
}
