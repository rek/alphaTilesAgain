import { MalaysiaContainer } from '@alphaTiles/feature-game-malaysia';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function MalaysiaRoute() {
  const params = useLocalSearchParams();
  return <MalaysiaContainer {...params} icons={gameIcons} />;
}
