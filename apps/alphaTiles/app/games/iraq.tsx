import { IraqContainer } from '@alphaTiles/feature-game-iraq';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function IraqRoute() {
  const params = useLocalSearchParams();
  return <IraqContainer {...params} icons={gameIcons} />;
}
