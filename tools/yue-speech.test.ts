/**
 * yue pack speech — every pack item the games can speak is audible.
 *
 * Loads the REAL languages/yue pack through the production binder
 * (`loadLangPack`) and drives pack speech (createPackSpeech) through its
 * interface with an in-memory player, so this covers the same key resolution
 * and fallbacks the app runs.
 *
 * Documented fallbacks:
 *   - word with no recording → syllable chain (yue composite numerals)
 *   - syllable with no recording → first word containing it (Taiwan hanzi,
 *     opt-in `orContainingWord`)
 *
 * Run: npx jest -c tools/jest.config.ts tools/yue-speech.test.ts
 */
import { buildTaiwanData } from '../libs/alphaTiles/feature-game-taiwan/src/buildTaiwanData';
import { loadPackAssets } from './_loadPackAssets';
import { packSpeechFor } from './_packSpeechFor';

const COMPOSITE_NUMERALS = ['zz_20', 'zz_30', 'zz_50', 'zz_1000000', 'zz_203'];

const loadYue = () => loadPackAssets('yue', { strokes: 'stub' });

type Item = Parameters<ReturnType<typeof packSpeechFor>['speech']['speak']>[0];

describe('yue pack speech (real pack)', () => {
  const assets = loadYue();

  /** Every clip `item` plays, start to end of any chain. */
  function hear(item: Item): string[] {
    const { speech, played } = packSpeechFor(assets);
    speech.speak(item);
    jest.runAllTimers();
    return played;
  }

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  describe('Italy T door (word lotería) — composite numerals', () => {
    const word = (lwc: string) => {
      const w = assets.words.rows.find((r) => r.wordInLWC === lwc);
      if (!w) throw new Error(`no word ${lwc}`);
      return w;
    };

    it('the 5 numerals are in the Italy-T deck source but have no word clip (was silent: Italy called audio.playWord(lwc))', () => {
      // Italy-T's source list is every word row (ItalyContainer sourceItems).
      const unrecorded = assets.words.rows
        .filter((w) => assets.audio.words[w.wordInLWC] === undefined)
        .map((w) => w.wordInLWC);
      expect(unrecorded.sort()).toEqual([...COMPOSITE_NUMERALS].sort());
    });

    it.each(COMPOSITE_NUMERALS)('%s now speaks every syllable of its LOP', (lwc) => {
      const w = word(lwc);
      expect(hear({ word: w })).toEqual([...w.wordInLOP].map((ch) => `syllable:${ch}`));
    });

    it.each(COMPOSITE_NUMERALS)(
      '%s plays its own recording, not the chain, once audio/words/%s.mp3 is bound',
      (lwc) => {
        const words = { ...assets.audio.words, [lwc]: 999 };
        const recorded = { ...assets, audio: { ...assets.audio, words } };
        const { speech, played } = packSpeechFor(recorded);
        speech.speak({ word: word(lwc) });
        jest.runAllTimers();
        expect(played).toEqual([`word:${lwc}`]);
      },
    );

    it('二百零三 chain duration covers 4 clips + 3 gaps', () => {
      const { speech } = packSpeechFor(assets, 500);
      expect(speech.durationOf({ word: word('zz_203') })).toBe(4 * 500 + 3 * 150);
    });
  });

  it('every word speaks (own clip, or the documented syllable chain)', () => {
    const silent: string[] = [];
    const chained: string[] = [];
    for (const w of assets.words.rows) {
      const clips = hear({ word: w });
      if (clips.length === 0) silent.push(w.wordInLWC);
      else if (clips[0] !== `word:${w.wordInLWC}`) chained.push(w.wordInLWC);
    }
    expect(silent).toEqual([]);
    expect(chained.sort()).toEqual([...COMPOSITE_NUMERALS].sort());
  });

  it('every tile speaks its own clip (keyed by base, not AudioName)', () => {
    const wrong = assets.tiles.rows
      .filter((t) => t.audioName !== 'zz_no_audio_needed')
      .filter((t) => hear({ tile: t }).join() !== `tile:${t.base}`)
      .map((t) => t.base);
    expect(wrong).toEqual([]);
  });

  it('every syllable speaks its own clip', () => {
    const wrong = assets.syllables.rows
      .filter((s) => hear({ syllable: s }).join() !== `syllable:${s.syllable}`)
      .map((s) => s.syllable);
    expect(wrong).toEqual([]);
  });

  it('every bound door instruction speaks', () => {
    const silent = assets.games.rows
      .map((g) => g.instructionAudio)
      .filter((id) => id !== 'X' && id !== 'naWhileMPOnly')
      .filter((id) => hear({ instruction: id }).length === 0);
    expect(silent).toEqual([]);
  });

  describe('Taiwan traceable characters', () => {
    const data = buildTaiwanData(assets);

    it('女 plays the 女 syllable, not the daughter compound (issue #45)', () => {
      expect(data.availableTiles).toContain('女');
      expect(hear({ syllable: { syllable: '女' } })).toEqual(['syllable:女']);
    });

    it('Curtis 13 recordings all resolve to syllable audio', () => {
      for (const ch of [...'人士女丈大上下工小叉手公夫']) {
        expect(hear({ syllable: { syllable: ch } })).toEqual([`syllable:${ch}`]);
      }
    });

    it('every traceable char speaks (syllable, else a word containing it)', () => {
      const silent = data.availableTiles.filter((ch) => hear({ syllable: { syllable: ch }, orContainingWord: true }).length === 0);
      expect(silent).toEqual([]);
    });
  });
});
