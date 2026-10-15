import { GeorgiaContainer } from '@alphaTiles/feature-game-georgia';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function GeorgiaRoute() {
  const params = useLocalSearchParams();
  return <GeorgiaContainer {...params} icons={gameIcons} />;
}
