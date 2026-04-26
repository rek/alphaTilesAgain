import { GeorgiaContainer } from '@alphaTiles/feature-game-georgia';
import { useLocalSearchParams } from 'expo-router';
import type { GameShellIcons } from '@alphaTiles/feature-game-shell';

const gameIcons: GameShellIcons = {
  back: require('../../assets/zz_games_home.png'),
  instructions: require('../../assets/zz_instructions.png'),
  trackerComplete: require('../../assets/zz_complete.png'),
  trackerIncomplete: require('../../assets/zz_incomplete.png'),
};

export default function GeorgiaRoute() {
  const params = useLocalSearchParams();
  return <GeorgiaContainer {...params} icons={gameIcons} />;
}
