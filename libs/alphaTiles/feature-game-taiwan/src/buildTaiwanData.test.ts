import { buildTaiwanData } from './buildTaiwanData';
import type { LangAssets } from '@alphaTiles/data-language-assets';

function mkAssets(opts: {
  tileBases: string[];
  strokeChars: string[] | Record<string, number>;
  words?: Array<{ lop: string; lwc: string; audio?: number }>;
}): LangAssets {
  const strokes: Record<string, { character: string; strokes: string[]; medians: number[][][] }> = {};
  const strokeEntries: Array<[string, number]> = Array.isArray(opts.strokeChars)
    ? opts.strokeChars.map((ch) => [ch, 1])
    : Object.entries(opts.strokeChars);
  for (const [ch, count] of strokeEntries) {
    strokes[ch] = {
      character: ch,
      strokes: new Array(count).fill('M0 0'),
      medians: [],
    };
  }
  const audioWords: Record<string, number> = {};
  const wordRows: Array<{ wordInLOP: string; wordInLWC: string }> = [];
  for (const w of opts.words ?? []) {
    if (w.audio !== undefined) audioWords[w.lwc] = w.audio;
    wordRows.push({ wordInLOP: w.lop, wordInLWC: w.lwc });
  }
  return {
    tiles: { rows: opts.tileBases.map((b) => ({ base: b })) },
    words: { rows: wordRows },
    audio: { words: audioWords },
    strokes,
  } as unknown as LangAssets;
}

describe('buildTaiwanData', () => {
  it('decomposes compounds, filters to chars with stroke data, dedupes', () => {
    const assets = mkAssets({
      tileBases: ['醫生 ', '護士 ', '檢查 '],
      strokeChars: ['醫', '生', '護', '士'], // 檢, 查 missing
    });
    const out = buildTaiwanData(assets);
    expect(out.availableTiles.sort()).toEqual(['士', '護', '生', '醫'].sort());
  });

  it('sorts availableTiles by stroke count ascending (simple → complex)', () => {
    // 大=3, 上=3, 醫=17, 護=20 — tiebreak by first-appearance order in tiles.
    const assets = mkAssets({
      tileBases: ['醫護 ', '大上 '],
      strokeChars: { 醫: 17, 護: 20, 大: 3, 上: 3 },
    });
    const out = buildTaiwanData(assets);
    expect(out.availableTiles).toEqual(['大', '上', '醫', '護']);
  });

  it('falls back to count 0 when stroke entry has empty strokes array', () => {
    const assets = mkAssets({
      tileBases: ['甲乙 '],
      strokeChars: { 甲: 0, 乙: 1 },
    });
    const out = buildTaiwanData(assets);
    expect(out.availableTiles).toEqual(['甲', '乙']);
  });

  it('returns empty when strokes is {} (non-Chinese pack)', () => {
    const assets = mkAssets({ tileBases: ['cat', 'dog'], strokeChars: [] });
    const out = buildTaiwanData(assets);
    expect(out.availableTiles).toEqual([]);
    expect(out.audioForChar).toEqual({});
  });

  it('first-compound-wins audio fallback per character', () => {
    const assets = mkAssets({
      tileBases: ['醫生 ', '醫院 '],
      strokeChars: ['醫', '生', '院'],
      words: [
        { lop: '醫生', lwc: 'doctor', audio: 100 },
        { lop: '醫院', lwc: 'hospital', audio: 200 },
      ],
    });
    const out = buildTaiwanData(assets);
    // 醫 first appears in 'doctor' — first-compound-wins.
    expect(out.audioForChar['醫']).toBe('doctor');
    expect(out.audioForChar['生']).toBe('doctor');
    expect(out.audioForChar['院']).toBe('hospital');
  });

  it('skips words without audio entries', () => {
    const assets = mkAssets({
      tileBases: ['醫生 '],
      strokeChars: ['醫', '生'],
      words: [{ lop: '醫生', lwc: 'doctor' /* no audio */ }],
    });
    const out = buildTaiwanData(assets);
    expect(out.audioForChar).toEqual({});
  });
});
