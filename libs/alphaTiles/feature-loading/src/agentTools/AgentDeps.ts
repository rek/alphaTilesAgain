import type { agentProbe } from '@shared/util-agent-tools';

/** One door as the agent sees it: pack facts + the active player's standing. */
export type AgentDoor = {
  index: number;
  classKey: string;
  variant: string;
  challengeLevel: string | number;
  enabled: boolean;
  tracksProgress: boolean;
  visual: 'not-started' | 'in-process' | 'mastery';
  trackerCount: number;
  points: number;
};

export type AgentPlayer = { id: string; name: string; avatarIndex: number };

/**
 * Everything the alphaTiles agent tools read or do. The bridge builds it from
 * stores, hooks and the router; tests pass fakes. Keeping the tools behind it
 * keeps them free of React, expo-router and storage.
 */
export type AgentDeps = {
  doors: () => AgentDoor[];
  activePlayerId: () => string | null;
  players: {
    list: () => AgentPlayer[];
    create: (input: { name: string; avatarIndex: number }) => AgentPlayer;
    select: (id: string) => void;
  };
  settings: {
    read: () => { showGameNames: boolean };
    set: (patch: { showGameNames?: boolean }) => boolean;
  };
  navigate: (href: string) => void;
  probe: () => ReturnType<typeof agentProbe.snapshot>;
};
