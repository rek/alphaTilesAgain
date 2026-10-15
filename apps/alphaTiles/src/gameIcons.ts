import type { GameShellIcons } from '@alphaTiles/feature-game-shell';

// Single app-level icon map shared by every game route (type:ui libs cannot
// resolve app assets). See docs/GAME_PATTERNS.md "New game routes must inject chrome assets".
export const gameIcons: GameShellIcons = {
  back: require('../assets/zz_games_home.png'),
  instructions: require('../assets/zz_instructions.png'),
  trackerComplete: require('../assets/zz_complete.png'),
  trackerIncomplete: require('../assets/zz_incomplete.png'),
};
