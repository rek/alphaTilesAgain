import { ItalyContainer } from '@alphaTiles/feature-game-italy';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function ItalyRoute() {
  const params = useLocalSearchParams();
  return <ItalyContainer {...params} icons={gameIcons} />;
}
