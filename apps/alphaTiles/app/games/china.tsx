import { ChinaContainer } from '@alphaTiles/feature-game-china';
import { useLocalSearchParams } from 'expo-router';

export default function ChinaRoute() {
  const params = useLocalSearchParams();
  return <ChinaContainer {...params} />;
}
