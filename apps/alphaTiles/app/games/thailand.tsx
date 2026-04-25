import { ThailandContainer } from '@alphaTiles/feature-game-thailand';
import { useLocalSearchParams } from 'expo-router';

export default function ThailandRoute() {
  const params = useLocalSearchParams();
  return <ThailandContainer {...params} />;
}
