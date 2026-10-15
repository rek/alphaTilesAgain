import { JapanContainer } from '@alphaTiles/feature-game-japan';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function JapanRoute() {
  const params = useLocalSearchParams();
  return <JapanContainer {...params} icons={gameIcons} />;
}
