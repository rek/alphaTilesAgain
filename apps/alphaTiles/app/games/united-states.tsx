import { UnitedStatesContainer } from '@alphaTiles/feature-game-united-states';
import { useLocalSearchParams } from 'expo-router';

export default function UnitedStatesRoute() {
  const params = useLocalSearchParams();
  return <UnitedStatesContainer {...params} />;
}
