import type { GameShellIcons } from '@alphaTiles/feature-game-shell';

// App-level chrome icons for the game shell (type:ui libs cannot resolve app
// assets). Injected once, for every game class, by app/games/[classKey].tsx.
export const gameIcons: GameShellIcons = {
  back: require('../assets/zz_games_home.png'),
  instructions: require('../assets/zz_instructions.png'),
  trackerComplete: require('../assets/zz_complete.png'),
  trackerIncomplete: require('../assets/zz_incomplete.png'),
};
