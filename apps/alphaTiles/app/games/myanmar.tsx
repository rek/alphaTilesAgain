import { MyanmarContainer } from '@alphaTiles/feature-game-myanmar';
import { useLocalSearchParams } from 'expo-router';
import type { GameShellIcons } from '@alphaTiles/feature-game-shell';

const gameIcons: GameShellIcons = {
  back: require('../../assets/zz_games_home.png'),
  instructions: require('../../assets/zz_instructions.png'),
  advance: require('../../assets/zz_forward.png'),
  advanceInactive: require('../../assets/zz_forward_inactive.png'),
  trackerComplete: require('../../assets/zz_complete.png'),
  trackerIncomplete: require('../../assets/zz_incomplete.png'),
};

export default function MyanmarRoute() {
  const params = useLocalSearchParams();
  return <MyanmarContainer {...params} icons={gameIcons} />;
}
