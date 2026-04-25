import { MexicoContainer } from '@alphaTiles/feature-game-mexico';
import { useLocalSearchParams } from 'expo-router';

export default function MexicoRoute() {
  const params = useLocalSearchParams();
  return <MexicoContainer {...params} />;
}
