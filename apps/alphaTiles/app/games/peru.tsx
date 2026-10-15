import { PeruContainer } from '@alphaTiles/feature-game-peru';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function PeruRoute() {
  const params = useLocalSearchParams();
  return <PeruContainer {...params} icons={gameIcons} />;
}
