import { MalaysiaContainer } from '@alphaTiles/feature-game-malaysia';
import { useLocalSearchParams } from 'expo-router';
import type { GameShellIcons } from '@alphaTiles/feature-game-shell';

const gameIcons: GameShellIcons = {
  back: require('../../assets/zz_games_home.png'),
  instructions: require('../../assets/zz_instructions.png'),
  trackerComplete: require('../../assets/zz_complete.png'),
  trackerIncomplete: require('../../assets/zz_incomplete.png'),
};

export default function MalaysiaRoute() {
  const params = useLocalSearchParams();
  return <MalaysiaContainer {...params} icons={gameIcons} />;
}
