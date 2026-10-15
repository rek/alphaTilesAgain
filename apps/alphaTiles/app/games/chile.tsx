import { ChileContainer } from '@alphaTiles/feature-game-chile';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function ChileRoute() {
  const params = useLocalSearchParams();
  return <ChileContainer {...params} icons={gameIcons} />;
}
