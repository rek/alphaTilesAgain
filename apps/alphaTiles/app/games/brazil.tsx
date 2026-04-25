import { BrazilContainer } from '@alphaTiles/feature-game-brazil';
import { useLocalSearchParams } from 'expo-router';

export default function BrazilRoute() {
  const params = useLocalSearchParams();
  return <BrazilContainer {...params} />;
}
