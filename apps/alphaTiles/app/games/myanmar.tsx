import { MyanmarContainer } from '@alphaTiles/feature-game-myanmar';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function MyanmarRoute() {
  const params = useLocalSearchParams();
  return <MyanmarContainer {...params} icons={gameIcons} />;
}
