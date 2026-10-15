/**
 * Dev-only route for the game-bod-uchen stroke spike (src/dev/SpikeBod).
 * Release bundles fold `__DEV__` to false, dropping the require — and the
 * synthetic, not-shippable Tibetan stroke data — so the route redirects home.
 */
import type React from 'react';
import { Redirect } from 'expo-router';

const SpikeBod: React.ComponentType | null = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../src/dev/SpikeBod').default
  : null;

export default function SpikeBodRoute(): React.JSX.Element {
  if (!SpikeBod) return <Redirect href="/" />;
  return <SpikeBod />;
}
