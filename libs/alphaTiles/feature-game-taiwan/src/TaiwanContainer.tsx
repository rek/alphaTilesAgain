/**
 * Route-entry boundary for game-taiwan.
 *
 * Why the dynamic import: `expo-router` `web.output: 'static'` prerenders
 * every route in Node. `@jamsch/react-native-hanzi-writer` uses
 * `react-native-reanimated` v4 worklets via `react-native-worklets`, whose
 * runtime is broken under Node SSR (TDZ on `getPathString`). Importing
 * `TaiwanInner` dynamically inside `useEffect` keeps the worklet code path
 * out of the static-prerender pass; the SSR pass renders the loading shell
 * only.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { GameShellIcons } from '@alphaTiles/feature-game-shell';

type TaiwanInnerModule = typeof import('./TaiwanInner');

export type TaiwanContainerProps = {
  icons: GameShellIcons;
  challengeLevel?: string | string[];
};

export function TaiwanContainer(props: TaiwanContainerProps): React.JSX.Element {
  const [mod, setMod] = useState<TaiwanInnerModule | null>(null);

  useEffect(() => {
    import('./TaiwanInner').then(setMod);
  }, []);

  if (!mod) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  const Inner = mod.TaiwanInner;
  return <Inner {...props} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
