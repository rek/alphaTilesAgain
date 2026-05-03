import { useStrokes } from './useStrokes';
import { __setMockStrokes } from '../__mocks__/data-language-assets';
import type { StrokeData } from '@alphaTiles/data-language-pack';

describe('useStrokes', () => {
  it('returns empty record when pack has no strokes', () => {
    __setMockStrokes({});
    expect(useStrokes()).toEqual({});
  });

  it('returns the strokes record from langAssets', () => {
    const sample: StrokeData = {
      character: '醫',
      strokes: ['M0 0L1 1', 'M1 1L2 2'],
      medians: [
        [
          [0, 0],
          [1, 1],
        ],
        [
          [1, 1],
          [2, 2],
        ],
      ],
    };
    __setMockStrokes({ 醫: sample });
    const out = useStrokes();
    expect(out['醫']).toBe(sample);
  });

  it('returns undefined for missing characters (no throw)', () => {
    __setMockStrokes({});
    expect(useStrokes()['X']).toBeUndefined();
  });
});
