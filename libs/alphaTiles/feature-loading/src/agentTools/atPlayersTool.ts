import { defineAgentTool } from '@shared/util-agent-tools';
import type { AgentDeps } from './AgentDeps';

export const atPlayersTool = (deps: Pick<AgentDeps, 'players' | 'activePlayerId'>) =>
  defineAgentTool({
    name: 'at_players',
    description:
      'Players store. action "list" (default), "create" (name, optional avatarIndex; also selects), or "select" (id or name).',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'create', 'select'] },
        name: { type: 'string' },
        avatarIndex: { type: 'number' },
        id: { type: 'string' },
      },
    },
    readOnly: false,
    run: async ({ action = 'list', name, avatarIndex, id }) => {
      if (action === 'create') {
        if (typeof name !== 'string' || name.trim() === '') throw new Error('create needs a name');
        const player = deps.players.create({
          name: name.trim(),
          avatarIndex: typeof avatarIndex === 'number' ? avatarIndex : 0,
        });
        deps.players.select(player.id);
      } else if (action === 'select') {
        const match = deps.players.list().find((p) => p.id === id || p.name === name);
        if (!match) throw new Error('no such player');
        deps.players.select(match.id);
      } else if (action !== 'list') {
        throw new Error(`unknown action ${String(action)}`);
      }
      return { activePlayerId: deps.activePlayerId(), players: deps.players.list() };
    },
  });
