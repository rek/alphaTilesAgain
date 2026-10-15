import { EcuadorContainer } from '@alphaTiles/feature-game-ecuador';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function EcuadorRoute() {
  const params = useLocalSearchParams();
  return <EcuadorContainer {...params} icons={gameIcons} />;
}
