import { ItalyContainer } from '@alphaTiles/feature-game-italy';
import { useLocalSearchParams } from 'expo-router';

export default function ItalyRoute() {
  const params = useLocalSearchParams();
  return <ItalyContainer {...params} />;
}
