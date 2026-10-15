import React from 'react';
import { GameRouteContainer } from '@alphaTiles/feature-game-shell';
import { gameClasses } from '../../src/gameClasses';
import { gameClassKeys, type GameClassKey } from '../../src/gameClassKeys';
import { gameIcons } from '../../src/gameIcons';

/** Web static export: one prerendered page per class (`/games/<classKey>.html`). */
export function generateStaticParams(): { classKey: GameClassKey }[] {
  return gameClassKeys.map((classKey) => ({ classKey }));
}

/** The one game route: `/games/<classKey>?doorIndex=…` (see GameRouteContainer). */
export default function GameRoute(): React.JSX.Element {
  return <GameRouteContainer gameClasses={gameClasses} icons={gameIcons} />;
}
