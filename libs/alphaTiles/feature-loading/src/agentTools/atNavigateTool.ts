import { defineAgentTool } from '@shared/util-agent-tools';
import type { AgentDeps } from './AgentDeps';
import { pageLocation, sleep } from './pageDom';

/** Waits for the path to match, then for the screen to stop changing. */
export const atNavigateTool = (deps: Pick<AgentDeps, 'navigate'>) =>
  defineAgentTool({
    name: 'at_navigate',
    description:
      'Navigate like a link press (expo-router push), e.g. href "/settings" or "/games/thailand?doorIndex=1". Waits for the screen to settle and returns the location.',
    inputSchema: {
      type: 'object',
      properties: { href: { type: 'string' } },
      required: ['href'],
    },
    readOnly: false,
    run: async ({ href }) => {
      if (typeof href !== 'string' || !href.startsWith('/')) throw new Error('href must start with "/"');
      const target = href.split('?')[0];
      deps.navigate(href);
      for (let waited = 0; waited < 10_000; waited += 100) {
        if (pageLocation().path === target) break;
        await sleep(100);
      }
      if (pageLocation().path !== target) {
        throw new Error(`still at ${pageLocation().path} after navigating to ${href}`);
      }
      await sleep(400);
      return pageLocation();
    },
  });
