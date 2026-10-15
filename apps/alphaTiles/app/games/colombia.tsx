import { ColombiaContainer } from '@alphaTiles/feature-game-colombia';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function ColombiaRoute() {
  const params = useLocalSearchParams();
  return <ColombiaContainer {...params} icons={gameIcons} />;
}
