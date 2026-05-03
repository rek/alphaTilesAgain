import { checkStrokeData } from '../checkStrokeData';
import { mkParsed, mkInventory, mkTileRow } from '../../__tests__/testHelpers';

const VALID_LANGINFO_CHINESE = [
  { label: 'Lang Name (In Local Lang)', value: '廣東話' },
  { label: 'Lang Name (In English)', value: 'Cantonese' },
  { label: 'Ethnologue code', value: 'yue' },
  { label: 'Country', value: 'HK' },
  { label: 'Game Name (In Local Lang)', value: '廣東話' },
  { label: 'Script direction (LTR or RTL)', value: 'LTR' },
  { label: 'The word NAME in local language', value: '名' },
  { label: 'Script type', value: 'Chinese' },
  { label: 'Email', value: 'a@b.c' },
  { label: 'Privacy Policy', value: 'https://example.com' },
];

const SAMPLE_STROKE_JSON = JSON.stringify({
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
});

describe('checkStrokeData', () => {
  it('skips silently for non-Chinese packs', () => {
    const parsed = mkParsed({});
    const inventory = mkInventory({});
    expect(checkStrokeData(parsed, inventory)).toEqual([]);
  });

  it('warns on coverage gap for Chinese pack', () => {
    const parsed = mkParsed({
      langInfoEntries: VALID_LANGINFO_CHINESE,
      tileRows: [mkTileRow({ base: '醫生' }), mkTileRow({ base: '護士' })],
    });
    const inventory = mkInventory({
      strokeChars: ['醫', '生'], // missing 護, 士
      strokeFileContents: { 醫: SAMPLE_STROKE_JSON, 生: SAMPLE_STROKE_JSON },
    });
    const issues = checkStrokeData(parsed, inventory);
    const codes = issues.map((i) => i.code);
    expect(codes).toContain('STROKE_COVERAGE_GAP');
    const missing = issues
      .filter((i) => i.code === 'STROKE_COVERAGE_GAP')
      .map((i) => i.context?.['character']);
    expect(missing).toEqual(expect.arrayContaining(['護', '士']));
    expect(missing).not.toContain('醫');
    expect(issues.every((i) => i.severity === 'warning')).toBe(true);
  });

  it('clean run when Chinese pack has full coverage', () => {
    const parsed = mkParsed({
      langInfoEntries: VALID_LANGINFO_CHINESE,
      tileRows: [mkTileRow({ base: '醫生' })],
    });
    const inventory = mkInventory({
      strokeChars: ['醫', '生'],
      strokeFileContents: { 醫: SAMPLE_STROKE_JSON, 生: SAMPLE_STROKE_JSON },
    });
    expect(checkStrokeData(parsed, inventory)).toEqual([]);
  });

  it('errors on malformed JSON regardless of script type', () => {
    const parsed = mkParsed({});
    const inventory = mkInventory({
      strokeChars: ['x'],
      strokeFileContents: { x: 'not json {{{' },
    });
    const issues = checkStrokeData(parsed, inventory);
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'STROKE_DATA_MALFORMED',
        severity: 'error',
        context: expect.objectContaining({ character: 'x' }),
      }),
    );
  });

  it('errors on strokes/medians length mismatch', () => {
    const bad = JSON.stringify({
      character: '醫',
      strokes: ['a', 'b'],
      medians: [[[0, 0]]],
    });
    const parsed = mkParsed({});
    const inventory = mkInventory({
      strokeChars: ['醫'],
      strokeFileContents: { 醫: bad },
    });
    const issues = checkStrokeData(parsed, inventory);
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'STROKE_DATA_MALFORMED',
        severity: 'error',
        message: expect.stringMatching(/strokes\.length \(2\) !== medians\.length \(1\)/),
      }),
    );
  });
});
