/**
 * Dev-only, web-only: publishes the alphaTiles WebMCP tools (docs/TESTING.md,
 * "Agent hand-checks"). Renders nothing; keeps a live view of doors/progress
 * from hooks, and registers the tools once. AppShell `require`s this module
 * inside a `__DEV__` branch so a production export never bundles it.
 */
import { useRef } from 'react';
import { router } from 'expo-router';
import { useDoors } from '@alphaTiles/data-doors';
import { doorProgressOf } from '@alphaTiles/data-door-progress';
import { useProgressStore } from '@alphaTiles/data-progress';
import { useEffectiveSettings } from '@alphaTiles/data-settings';
import { useActivePlayer, usePlayerPreferencesStore, usePlayersStore } from '@alphaTiles/data-players';
import { agentProbe } from '@shared/util-agent-tools';
import { useMountEffect } from '@shared/util-hooks';
import type { AgentDeps, AgentDoor } from './AgentDeps';
import { registerAlphaTilesAgentTools } from './registerAlphaTilesAgentTools';

export function AgentToolsBridge(): null {
  const doors = useDoors();
  const progress = useProgressStore((s) => s.progress);
  const playerId = useActivePlayer()?.id ?? null;
  const { showGameNames } = useEffectiveSettings();

  // Refreshed every render: tools call these at press time, not at registration.
  const live = useRef({ doors: [] as AgentDoor[], showGameNames: true });
  live.current = {
    showGameNames,
    doors: doors.map((door) => {
      const standing = doorProgressOf({ door, playerId, progress });
      return {
        index: door.index,
        classKey: door.classKey,
        variant: door.variant,
        challengeLevel: door.challengeLevel,
        enabled: door.enabled,
        tracksProgress: door.tracksProgress,
        visual: standing.visual,
        trackerCount: standing.trackerCount,
        points: standing.points,
      };
    }),
  };

  useMountEffect(() => {
    const toAgentPlayer = ({ id, name, avatarIndex }: { id: string; name: string; avatarIndex: number }) => ({
      id,
      name,
      avatarIndex,
    });
    const deps: AgentDeps = {
      doors: () => live.current.doors,
      activePlayerId: () => usePlayersStore.getState().activePlayerId,
      players: {
        list: () => usePlayersStore.getState().players.map(toAgentPlayer),
        create: (input) => toAgentPlayer(usePlayersStore.getState().createPlayer(input)),
        select: (id) => usePlayersStore.getState().selectPlayer(id),
      },
      settings: {
        read: () => ({ showGameNames: live.current.showGameNames }),
        set: (patch) => {
          const id = usePlayersStore.getState().activePlayerId;
          if (id === null) return false;
          usePlayerPreferencesStore.getState().setPreference(id, patch);
          return true;
        },
      },
      navigate: (href) => router.push(href as Parameters<typeof router.push>[0]),
      probe: agentProbe.snapshot,
    };
    return registerAlphaTilesAgentTools(deps);
  });

  return null;
}
