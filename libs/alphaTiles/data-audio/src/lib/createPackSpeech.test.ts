import { createPackSpeech } from './createPackSpeech';
import type { ClipCategory } from './planSpeech';

type Clips = Partial<Record<ClipCategory, Record<string, number | undefined>>>;

const pack = {
  syllables: ['二', '十', '醫', '生'].map((syllable) => ({ syllable })),
  words: [
    { wordInLWC: 'doctor', wordInLOP: '醫生' },
    { wordInLWC: 'zz_20', wordInLOP: '二十' },
  ],
};

function setup(clips: Clips) {
  const played: string[] = [];
  const lock = { held: 0, released: 0 };
  const warn = jest.fn();
  const speech = createPackSpeech({
    pack,
    clip: (category, id) => {
      const table = clips[category];
      return table && id in table ? { ms: table[id] } : null;
    },
    play: (category, id) => played.push(`${category}:${id}`),
    holdLock: () => {
      lock.held++;
      return () => lock.released++;
    },
    warn,
  });
  return { speech, played, lock, warn };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('createPackSpeech', () => {
  it('plays a tile by tile.base, never the AudioName', () => {
    const { speech, played } = setup({ tile: { 醫生: 900 } });
    expect(speech.speak({ tile: { base: '醫生' } })).toBe(900);
    expect(played).toEqual(['tile:醫生']);
  });

  it('plays a recorded word by wordInLWC without locking', () => {
    const { speech, played, lock } = setup({ word: { doctor: 1200 } });
    expect(speech.speak({ word: pack.words[0] })).toBe(1200);
    expect(played).toEqual(['word:doctor']);
    expect(lock.held).toBe(0);
  });

  it('chains syllables for an unrecorded word, with gap, holding the lock', () => {
    const { speech, played, lock } = setup({ syllable: { 二: 400, 十: 500 } });
    const ms = speech.speak({ word: pack.words[1] });
    expect(ms).toBe(400 + 150 + 500);
    expect(played).toEqual(['syllable:二']);
    expect(lock).toEqual({ held: 1, released: 0 });
    jest.advanceTimersByTime(549);
    expect(played).toEqual(['syllable:二']);
    jest.advanceTimersByTime(1);
    expect(played).toEqual(['syllable:二', 'syllable:十']);
    jest.advanceTimersByTime(500);
    expect(lock).toEqual({ held: 1, released: 1 });
  });

  it('durationOf matches speak without playing', () => {
    const { speech, played } = setup({ syllable: { 二: 400, 十: undefined } });
    expect(speech.durationOf({ word: pack.words[1] })).toBe(400 + 150 + 700);
    expect(played).toEqual([]);
  });

  it('a new speak cancels a running chain and releases its lock', () => {
    const { speech, played, lock } = setup({ syllable: { 二: 400, 十: 500 }, word: { doctor: 900 } });
    speech.speak({ word: pack.words[1] });
    speech.speak({ word: pack.words[0] });
    jest.runAllTimers();
    expect(played).toEqual(['syllable:二', 'word:doctor']);
    expect(lock).toEqual({ held: 1, released: 1 });
  });

  it('stop cancels pending chain steps', () => {
    const { speech, played } = setup({ syllable: { 二: 400, 十: 500 } });
    speech.speak({ word: pack.words[1] });
    speech.stop();
    jest.runAllTimers();
    expect(played).toEqual(['syllable:二']);
  });

  it('falls back from an unrecorded syllable to a word containing it', () => {
    const { speech, played } = setup({ word: { doctor: 900 } });
    expect(speech.speak({ syllable: { syllable: '醫' } })).toBe(900);
    expect(played).toEqual(['word:doctor']);
  });

  it('prefers the syllable clip when present', () => {
    const { speech, played } = setup({ syllable: { 醫: 300 }, word: { doctor: 900 } });
    speech.speak({ syllable: { syllable: '醫' } });
    expect(played).toEqual(['syllable:醫']);
  });

  it('plays instructions by id', () => {
    const { speech, played } = setup({ instruction: { zzz_italy: 2000 } });
    expect(speech.speak({ instruction: 'zzz_italy' })).toBe(2000);
    expect(played).toEqual(['instruction:zzz_italy']);
  });

  it('is silent (warn once) when nothing resolves', () => {
    const { speech, played, warn } = setup({ syllable: { 二: 400 } });
    expect(speech.speak({ word: pack.words[1] })).toBeUndefined();
    speech.speak({ word: pack.words[1] });
    expect(played).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('does not confuse categories: a syllable clip never speaks a tile', () => {
    const { speech, played } = setup({ syllable: { 二: 400 } });
    expect(speech.speak({ tile: { base: '二' } })).toBeUndefined();
    expect(played).toEqual([]);
  });
});
