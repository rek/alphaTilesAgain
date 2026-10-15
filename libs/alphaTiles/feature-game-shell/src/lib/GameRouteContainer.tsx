import React from 'react';
import type { ComponentType } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useDoor, useDoors } from '@alphaTiles/data-doors';
import type { LangAssets } from '@alphaTiles/data-language-pack';
import type { GameShellIcons } from './GameShellScreen';
import { GameUnavailable } from './GameUnavailable';
import { resolveGameRoute } from './resolveGameRoute';

/** What the game route hands every container: route params + app chrome icons. */
export type GameContainerProps = Record<string, string | string[] | GameShellIcons | undefined> & {
  icons: GameShellIcons;
};

/** One game-class registry entry (apps/alphaTiles/src/gameClasses.ts). */
export type GameClass = {
  /** Rendered by the game route for every Door of this class. */
  Container: ComponentType<GameContainerProps>;
  /** Boot-time precompute; the container reads it via `usePrecompute(classKey)`. */
  precompute?: (assets: LangAssets) => unknown;
};

/**
 * The one game route (`app/games/[classKey].tsx`): `/games/<classKey>?doorIndex=…`.
 * The routed Door names the class (see resolveGameRoute); the app's game-class
 * registry supplies its container, and app chrome icons are injected once here.
 */
export function GameRouteContainer<K extends string>({
  gameClasses,
  icons,
}: {
  gameClasses: Record<K, GameClass>;
  icons: GameShellIcons;
}): React.JSX.Element {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const routedDoor = useDoor(params);
  const doors = useDoors();
  const hasDoorParam = params['doorIndex'] !== undefined || params['gameNumber'] !== undefined;

  const route = resolveGameRoute({
    urlClassKey: String(params['classKey'] ?? ''),
    hasDoorParam,
    routedDoor,
    doors,
    classKeys: Object.keys(gameClasses) as K[],
  });

  if (route.kind === 'menu') return <Redirect href="/menu" />;
  if (route.kind === 'unavailable') return <GameUnavailable classKey={route.classKey} />;

  const { Container } = gameClasses[route.classKey];
  // No door param: hand the shell the resolved Door so its useDoor agrees.
  const routeParams = hasDoorParam ? params : { ...params, doorIndex: String(route.doorIndex) };
  return <Container key={`${route.classKey}-${route.doorIndex}`} {...routeParams} icons={icons} />;
}
