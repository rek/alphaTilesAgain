import { defineAgentTool } from '@shared/util-agent-tools';
import { headingsOnPage, pageLocation, testIdsOnPage } from './pageDom';

export const atLocationTool = () =>
  defineAgentTool({
    name: 'at_location',
    description:
      'Where the app is: URL path + query, visible headings, and the testIDs on screen (e.g. game-door-tile, shell-back-button).',
    inputSchema: { type: 'object' },
    readOnly: true,
    run: async () => ({
      ...pageLocation(),
      headings: headingsOnPage(),
      testIDs: testIdsOnPage(),
    }),
  });
