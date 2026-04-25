import { JapanContainer } from '@alphaTiles/feature-game-japan';
import { useLocalSearchParams } from 'expo-router';

export default function JapanRoute() {
  const params = useLocalSearchParams();
  return <JapanContainer {...params} />;
}
