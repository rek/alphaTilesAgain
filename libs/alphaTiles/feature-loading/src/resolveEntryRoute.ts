import { usePlayersStore } from '@alphaTiles/data-players';

export function resolveEntryRoute(): '/choose-player' | '/menu' {
  const { activePlayerId, players } = usePlayersStore.getState();
  if (activePlayerId !== null && players.some((p) => p.id === activePlayerId)) {
    return '/menu';
  }
  return '/choose-player';
}
