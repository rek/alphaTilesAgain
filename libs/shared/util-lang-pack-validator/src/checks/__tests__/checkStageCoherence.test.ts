import { checkStageCoherence } from '../checkStageCoherence';
import { mkParsed, mkTileRow, mkWordRow } from '../../__tests__/testHelpers';
import { ISSUE_CODES } from '../../issueCodes';

describe('checkStageCoherence', () => {
  it('returns empty on no tiles', () => {
    const parsed = mkParsed({ tileRows: [], wordRows: [] });
    expect(checkStageCoherence(parsed)).toHaveLength(0);
  });

  it('emits STAGE_WORD_COUNT info issues for each stage', () => {
    const tiles = ['a', 'b', 'c'].map((base, i) =>
      mkTileRow({ base, type: 'V', stageOfFirstAppearance: i + 1 }),
    );
    const words = [
      mkWordRow({ wordInLWC: 'abc', wordInLOP: 'abc', stageOfFirstAppearance: '1' }),
    ];
    const parsed = mkParsed({ tileRows: tiles, wordRows: words });
    const issues = checkStageCoherence(parsed);
    const stageCountIssues = issues.filter((i) => i.code === ISSUE_CODES.STAGE_WORD_COUNT);
    expect(stageCountIssues).toHaveLength(7); // one per stage 1..7
  });

  it('emits EMPTY_STAGE warning for stages with 0 words', () => {
    // Word with LOP 'b' only parses from tile 'b' (stage 2)
    // With SCR=0.99 and firstLetter=true:
    //   stage 1 → first tile has stage 2 > 1, so correspondence=0 → word doesn't count for stage 1
    //   stages 2-7 → first tile has stage 2 ≤ stage, correspondence=1/1=1.0 ≥ 0.99 → word counts
    // So stage 1 should be EMPTY
    const tiles = [mkTileRow({ base: 'b', type: 'C', stageOfFirstAppearance: 2, alt1: '', alt2: '', alt3: '' })];
    const words = [mkWordRow({ wordInLWC: 'b', wordInLOP: 'b', stageOfFirstAppearance: '' })];
    const settingsEntries = [
      { label: 'Stage correspondence ratio', value: '0.99' },
      { label: 'First letter stage correspondence', value: 'true' },
    ];
    const parsedWithSettings = mkParsed({ tileRows: tiles, wordRows: words, settingsEntries });
    const issues = checkStageCoherence(parsedWithSettings);
    const emptyStageIssues = issues.filter((i) => i.code === ISSUE_CODES.EMPTY_STAGE);
    expect(emptyStageIssues.length).toBeGreaterThan(0);
  });
});
