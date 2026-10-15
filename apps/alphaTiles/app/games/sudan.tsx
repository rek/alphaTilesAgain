import { SudanContainer } from '@alphaTiles/feature-game-sudan';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function SudanRoute() {
  const params = useLocalSearchParams();
  return <SudanContainer {...params} icons={gameIcons} />;
}
