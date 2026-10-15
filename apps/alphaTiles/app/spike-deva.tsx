/**
 * Dev-only route for the game-india-deva stroke spike (src/dev/SpikeDeva).
 * Release bundles fold `__DEV__` to false, dropping the require — and the
 * CC BY-SA stroke data it pulls in — so the route just redirects home.
 */
import type React from 'react';
import { Redirect } from 'expo-router';

const SpikeDeva: React.ComponentType | null = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../src/dev/SpikeDeva').default
  : null;

export default function SpikeDevaRoute(): React.JSX.Element {
  if (!SpikeDeva) return <Redirect href="/" />;
  return <SpikeDeva />;
}
