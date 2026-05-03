import { buildTaiwanData } from './buildTaiwanData';
import type { LangAssets } from '@alphaTiles/data-language-assets';

function mkAssets(opts: {
  tileBases: string[];
  strokeChars: string[];
  words?: Array<{ lop: string; lwc: string; audio?: number }>;
}): LangAssets {
  const strokes: Record<string, { character: string; strokes: string[]; medians: number[][][] }> = {};
  for (const ch of opts.strokeChars) {
    strokes[ch] = { character: ch, strokes: [], medians: [] };
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
    expect(out.availableTiles).toEqual(['醫', '生', '護', '士']);
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
