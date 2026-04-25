import { PeruContainer } from '@alphaTiles/feature-game-peru';
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

export default function PeruRoute() {
  const params = useLocalSearchParams();
  return <PeruContainer {...params} icons={gameIcons} />;
}
