import { ChileContainer } from '@alphaTiles/feature-game-chile';
import { useLocalSearchParams } from 'expo-router';

export default function ChileRoute() {
  const params = useLocalSearchParams();
  return <ChileContainer {...params} />;
}
