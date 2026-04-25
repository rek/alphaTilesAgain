import { RomaniaContainer } from '@alphaTiles/feature-game-romania';
import { useLocalSearchParams } from 'expo-router';

export default function RomaniaRoute() {
  const params = useLocalSearchParams();
  return <RomaniaContainer {...params} />;
}
