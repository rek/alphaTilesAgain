import { ThailandContainer } from '@alphaTiles/feature-game-thailand';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function ThailandRoute() {
  const params = useLocalSearchParams();
  return <ThailandContainer {...params} icons={gameIcons} />;
}
