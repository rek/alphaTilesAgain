/**
 * App entry point — immediately derives the correct first screen.
 * No content rendered here; EntryRedirect in _layout.tsx handles routing.
 * Expo-router requires this file to exist as the root route.
 */
import { Redirect } from 'expo-router';
import { usePlayersStore } from '@alphaTiles/data-players';

export default function Index() {
  const { activePlayerId, players, clearActivePlayer } = usePlayersStore.getState();

  if (activePlayerId !== null) {
    const exists = players.some((p) => p.id === activePlayerId);
    if (!exists) {
      clearActivePlayer();
      return <Redirect href="/choose-player" />;
    }
    return <Redirect href="/menu" />;
  }

  return <Redirect href="/choose-player" />;
}
