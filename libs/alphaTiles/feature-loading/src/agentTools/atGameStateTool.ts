import { defineAgentTool } from '@shared/util-agent-tools';
import type { AgentDeps } from './AgentDeps';
import { elementsByTestId, labelOf, pageLocation, testIdsOnPage } from './pageDom';

/** `/games/<classKey>?doorIndex=N` -> the door, its progress, and the tiles on the board. */
export const atGameStateTool = (deps: Pick<AgentDeps, 'doors'>) =>
  defineAgentTool({
    name: 'at_game_state',
    description:
      "The game on screen: class, door, the player's trackers/points for it, whether the celebration overlay is up, and the answer tiles shown (label + disabled).",
    inputSchema: { type: 'object' },
    readOnly: true,
    run: async () => {
      const { path, search } = pageLocation();
      const match = /^\/games\/([^/]+)/.exec(path);
      if (!match) return { inGame: false, path };
      const doorIndex = Number(new URLSearchParams(search).get('doorIndex'));
      const door = deps.doors().find((d) => d.index === doorIndex) ?? null;
      return {
        inGame: true,
        classKey: match[1],
        doorIndex,
        door,
        celebrating: testIdsOnPage().includes('celebration-back-button'),
        tiles: elementsByTestId('game-board-tile').map((el, index) => ({
          index,
          label: labelOf(el),
          disabled: el.getAttribute('aria-disabled') === 'true',
        })),
      };
    },
  });
