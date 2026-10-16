import { defineAgentTool } from '@shared/util-agent-tools';
import type { AgentDeps } from './AgentDeps';
import { elementsByTestId, labelOf, pageLocation, sleep } from './pageDom';

/** Presses a board tile by label (or index) and reports whether the door's tracker/points moved. */
export const atGameAnswerTool = (deps: Pick<AgentDeps, 'doors'>) =>
  defineAgentTool({
    name: 'at_game_answer',
    description:
      'Press an answer tile in the current game, by "value" (its label) or "index". Returns whether the answer counted (door trackerCount rose) plus the tiles after. Proves scoring, not the finger.',
    inputSchema: {
      type: 'object',
      properties: { value: { type: 'string' }, index: { type: 'number' } },
    },
    readOnly: false,
    run: async ({ value, index }) => {
      const doorIndex = Number(new URLSearchParams(pageLocation().search).get('doorIndex'));
      const standing = () => {
        const d = deps.doors().find((door) => door.index === doorIndex);
        return { trackerCount: d?.trackerCount ?? 0, points: d?.points ?? 0 };
      };
      const tiles = elementsByTestId('game-board-tile');
      const tile =
        typeof index === 'number' ? tiles[index] : tiles.find((el) => labelOf(el) === value);
      if (!tile) throw new Error(`no tile ${String(value ?? index)}; have ${tiles.map(labelOf).join(', ')}`);
      const before = standing();
      tile.click();
      await sleep(600);
      const after = standing();
      return {
        pressed: labelOf(tile),
        correct: after.trackerCount > before.trackerCount,
        before,
        after,
        tiles: elementsByTestId('game-board-tile').map(labelOf),
      };
    },
  });
