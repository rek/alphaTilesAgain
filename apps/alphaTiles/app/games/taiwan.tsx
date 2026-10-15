import { TaiwanContainer } from '@alphaTiles/feature-game-taiwan';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function TaiwanRoute() {
  const params = useLocalSearchParams();
  return <TaiwanContainer {...params} icons={gameIcons} />;
}
