import { SudanContainer } from '@alphaTiles/feature-game-sudan';
import { useLocalSearchParams } from 'expo-router';

export default function SudanRoute() {
  const params = useLocalSearchParams();
  return <SudanContainer {...params} />;
}
