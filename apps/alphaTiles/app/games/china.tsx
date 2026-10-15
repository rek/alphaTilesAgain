import { ChinaContainer } from '@alphaTiles/feature-game-china';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function ChinaRoute() {
  const params = useLocalSearchParams();
  return <ChinaContainer {...params} icons={gameIcons} />;
}
