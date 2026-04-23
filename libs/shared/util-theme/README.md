# util-theme

Shared token system: color palette, typography scale, spacing, font loading, and logical-prop helpers.

## API

```ts
import { useTheme, ThemeProvider, useFontsReady, style, buildTheme } from '@shared/util-theme';
```

- `useTheme(): Theme` — reads the current theme from context. Throws if called outside `<ThemeProvider>`.
- `ThemeProvider` — mount once at app root with `palette` (hexByIndex from parseColors) and `fontMap` (font name strings).
- `useFontsReady(fontMap)` — wraps `expo-font`'s `useFonts`, returns a `boolean`. Only `util-theme` imports `expo-font`.
- `buildTheme(palette, fontMap)` — pure function; useful for tests.
- `style.marginStart(n)`, `style.marginEnd(n)`, `style.paddingStart(n)`, `style.paddingEnd(n)` — logical-prop helpers (SpacingKey: 0|1|2|3|4|5|6|8|10|12|16).

## Storybook

Wrap stories in `<MockThemeProvider>` or use the `withMockTheme` decorator:

```ts
import { withMockTheme } from '@shared/util-theme/testing';

export const decorators = [withMockTheme];
```

## ESLint rule

The `theme-hygiene/no-raw-margin-left-right` rule (registered in repo-root `eslint.config.mjs`) bans physical-direction style keys (`marginLeft`, `marginRight`, `paddingLeft`, `paddingRight`, `left`, `right`, border variants). Use logical props instead:

```ts
// BAD — lint error
const s = { marginLeft: 16 };

// GOOD — lint passes
import { style } from '@shared/util-theme';
const s = style.marginStart(4); // { marginStart: 16 }
```

## Building

Run `nx build util-theme` to build the library.

## Running unit tests

Run `nx test util-theme` to execute the unit tests via [Jest](https://jestjs.io).
