/**
 * Integration test against the REAL yue pack (languages/yue).
 *
 * Builds `assets.audio.syllables` / `audio.words` the same way
 * tools/generate-lang-manifest.ts does (keys from aa_*.txt where the mp3 exists
 * on disk), runs the real `buildTaiwanData`, and asserts that the audio choice
 * for 女 is the syllable recording, not the compound-word fallback
 * (daughter.mp3). Issue #45.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { LangAssets } from '@alphaTiles/data-language-assets';
import { parseGametiles, parseSyllables, parseWordlist } from '../../../shared/util-lang-pack-parser/src';
import { buildTaiwanData } from './buildTaiwanData';
import { pickAudioForChar } from './pickAudioForChar';

const LANG = path.resolve(__dirname, '../../../../languages/yue');
const read = (f: string) => fs.readFileSync(path.join(LANG, f), 'utf8');
const files = (d: string) => new Set(fs.readdirSync(path.join(LANG, d)));

function loadYueAssets(): LangAssets {
  const syllFiles = files('audio/syllables');
  const wordFiles = files('audio/words');
  const syllables: Record<string, number> = {};
  let id = 1;
  for (const s of parseSyllables(read('aa_syllables.txt')).rows) {
    if (s.audioName && syllFiles.has(`${s.audioName}.mp3`)) syllables[s.audioName] = id++;
  }
  const words = parseWordlist(read('aa_wordlist.txt'));
  const audioWords: Record<string, number> = {};
  for (const w of words.rows) {
    if (wordFiles.has(`${w.wordInLWC}.mp3`)) audioWords[w.wordInLWC] = id++;
  }
  const strokes: Record<string, unknown> = {};
  for (const f of fs.readdirSync(path.join(LANG, 'strokes'))) {
    const ch = f.replace(/\.json$/, '');
    strokes[ch] = { character: ch, strokes: ['M0 0'], medians: [] };
  }
  return {
    tiles: parseGametiles(read('aa_gametiles.txt')),
    words,
    audio: { syllables, words: audioWords },
    strokes,
  } as unknown as LangAssets;
}

describe('yue pack: writing-game audio selection (real data)', () => {
  const assets = loadYueAssets();
  const data = buildTaiwanData(assets);
  const pick = (char: string) =>
    pickAudioForChar({ char, syllables: assets.audio.syllables, audioForChar: data.audioForChar });

  it('女 is traceable and plays the 女 syllable, not the daughter compound fallback', () => {
    expect(data.availableTiles).toContain('女');
    // The compound fallback exists and would have been the old (wrong) behaviour.
    expect(data.audioForChar['女']).toBe('daughter');
    expect(pick('女')).toEqual({ kind: 'syllable', char: '女' });
  });

  it('Curtis 13 recordings all resolve to syllable audio', () => {
    for (const ch of [...'人士女丈大上下工小叉手公夫']) {
      expect(assets.audio.syllables[ch]).toBeDefined();
      expect(pick(ch)).toEqual({ kind: 'syllable', char: ch });
    }
  });

  it('every traceable char resolves to some audio', () => {
    const silent = data.availableTiles.filter((c) => pick(c).kind === 'none');
    expect(silent).toEqual([]);
  });
});
