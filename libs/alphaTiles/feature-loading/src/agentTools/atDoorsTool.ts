import { defineAgentTool } from '@shared/util-agent-tools';
import type { AgentDeps } from './AgentDeps';

export const atDoorsTool = (deps: Pick<AgentDeps, 'doors' | 'activePlayerId'>) =>
  defineAgentTool({
    name: 'at_doors',
    description:
      "Every door of the loaded pack: game class, variant, level, enabled (hidden doors are false), and the active player's progress (visual state, trackers, points). Optional classKey filter.",
    inputSchema: { type: 'object', properties: { classKey: { type: 'string' } } },
    readOnly: true,
    run: async ({ classKey }) => {
      const doors = deps.doors().filter((d) => classKey === undefined || d.classKey === classKey);
      return { activePlayerId: deps.activePlayerId(), count: doors.length, doors };
    },
  });
