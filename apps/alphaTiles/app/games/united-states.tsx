import { UnitedStatesContainer } from '@alphaTiles/feature-game-united-states';
import { useLocalSearchParams } from 'expo-router';
import { gameIcons } from '../../src/gameIcons';

export default function UnitedStatesRoute() {
  const params = useLocalSearchParams();
  return <UnitedStatesContainer {...params} icons={gameIcons} />;
}
