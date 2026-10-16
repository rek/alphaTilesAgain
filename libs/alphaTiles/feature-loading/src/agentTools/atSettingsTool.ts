import { defineAgentTool } from '@shared/util-agent-tools';
import type { AgentDeps } from './AgentDeps';
import { sleep } from './pageDom';

export const atSettingsTool = (deps: Pick<AgentDeps, 'settings'>) =>
  defineAgentTool({
    name: 'at_settings',
    description:
      'Effective player settings. Pass showGameNames (boolean) to set it for the active player, as the settings screen does.',
    inputSchema: { type: 'object', properties: { showGameNames: { type: 'boolean' } } },
    readOnly: false,
    run: async ({ showGameNames }) => {
      if (typeof showGameNames === 'boolean') {
        if (!deps.settings.set({ showGameNames })) throw new Error('no active player to set a preference on');
        // The live view refreshes on the next render.
        await sleep(300);
      }
      return deps.settings.read();
    },
  });
