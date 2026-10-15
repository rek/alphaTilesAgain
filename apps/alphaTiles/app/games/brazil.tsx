import { BrazilContainer } from '@alphaTiles/feature-game-brazil';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function BrazilRoute() {
  const params = useLocalSearchParams();
  return <BrazilContainer {...params} icons={gameIcons} />;
}
