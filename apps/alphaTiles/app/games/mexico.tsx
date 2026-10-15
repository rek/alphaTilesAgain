import { MexicoContainer } from '@alphaTiles/feature-game-mexico';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function MexicoRoute() {
  const params = useLocalSearchParams();
  return <MexicoContainer {...params} icons={gameIcons} />;
}
