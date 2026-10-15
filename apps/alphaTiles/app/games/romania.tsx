import { RomaniaContainer } from '@alphaTiles/feature-game-romania';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function RomaniaRoute() {
  const params = useLocalSearchParams();
  return <RomaniaContainer {...params} icons={gameIcons} />;
}
