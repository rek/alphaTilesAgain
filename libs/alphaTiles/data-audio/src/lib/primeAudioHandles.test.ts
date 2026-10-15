import { primeAudioHandles } from './primeAudioHandles';
import type { AudioHandles } from './AudioHandles';
import type { SoundHandle } from './SoundHandle';

function makeMedia(playResult: Promise<void> | undefined = Promise.resolve()) {
  const calls: string[] = [];
  const media = {
    muted: false,
    mutedDuringPlay: undefined as boolean | undefined,
    play: jest.fn(() => {
      calls.push('play');
      media.mutedDuringPlay = media.muted;
      return playResult;
    }),
    pause: jest.fn(() => { calls.push('pause'); }),
    calls,
  };
  return media;
}

function webHandle(media = makeMedia()) {
  return { media, volume: 1, play: jest.fn(), pause: jest.fn() } as unknown as SoundHandle & {
    media: ReturnType<typeof makeMedia>;
    play: jest.Mock;
  };
}

function nativeHandle() {
  return { volume: 1, play: jest.fn(), pause: jest.fn() } as unknown as SoundHandle & {
    play: jest.Mock;
    pause: jest.Mock;
  };
}

function handlesWith(extra: Partial<AudioHandles> = {}): AudioHandles {
  return {
    tiles: new Map(),
    words: new Map(),
    syllables: new Map(),
    instructions: new Map(),
    chimes: { correct: webHandle(), incorrect: webHandle(), correctFinal: webHandle() },
    durations: { tiles: new Map(), words: new Map(), syllables: new Map(), instructions: new Map() },
    ...extra,
  };
}

describe('primeAudioHandles', () => {
  it('primes chimes and every category, skipping null handles', () => {
    const tile = webHandle();
    const word = webHandle();
    const syl = webHandle();
    const instr = webHandle();
    const handles = handlesWith({
      tiles: new Map<string, SoundHandle | null>([['a', tile], ['missing', null]]),
      words: new Map([['w', word]]),
      syllables: new Map([['s', syl]]),
      instructions: new Map([['i', instr]]),
    });
    expect(primeAudioHandles(handles)).toBe(7); // 3 chimes + 4 non-null
    for (const h of [tile, word, syl, instr]) {
      expect(h.media.calls).toEqual(['play', 'pause']);
    }
  });

  it('plays muted, then restores the muted flag', () => {
    const h = webHandle();
    primeAudioHandles(handlesWith({ tiles: new Map([['a', h]]) }));
    expect(h.media.mutedDuringPlay).toBe(true);
    expect(h.media.muted).toBe(false);
  });

  it('swallows the play() rejection (AbortError from pause) so no unhandled rejection', async () => {
    const rejected = Promise.reject(new Error('AbortError'));
    const catchSpy = jest.spyOn(rejected, 'catch');
    const h = webHandle(makeMedia(rejected));
    primeAudioHandles(handlesWith({ tiles: new Map([['a', h]]) }));
    expect(catchSpy).toHaveBeenCalled();
    await Promise.resolve();
  });

  it('falls back to handle.play/pause at volume 0 when no media element', () => {
    const h = nativeHandle();
    let volumeDuringPlay: number | undefined;
    h.play.mockImplementation(() => { volumeDuringPlay = h.volume; });
    primeAudioHandles(handlesWith({ words: new Map([['w', h]]) }));
    expect(h.play).toHaveBeenCalledTimes(1);
    expect(h.pause).toHaveBeenCalledTimes(1);
    expect(volumeDuringPlay).toBe(0);
    expect(h.volume).toBe(1);
  });

  it('keeps going when one handle throws', () => {
    const bad = webHandle();
    bad.media.play.mockImplementation(() => { throw new Error('boom'); });
    const good = webHandle();
    const queued = primeAudioHandles(
      handlesWith({ tiles: new Map([['bad', bad], ['good', good]]) }),
    );
    expect(queued).toBe(5); // 3 chimes + bad + good
    expect(good.media.calls).toEqual(['play', 'pause']);
  });

  describe('chunking (too many simultaneous plays killed the Chromium tab)', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('primes the first 40 synchronously, the rest on timers within 1 s', () => {
      const words = new Map<string, SoundHandle | null>();
      const all: ReturnType<typeof webHandle>[] = [];
      for (let i = 0; i < 427; i++) {
        const h = webHandle();
        all.push(h);
        words.set(`w${i}`, h);
      }
      const handles = handlesWith({ words });
      expect(primeAudioHandles(handles)).toBe(430);

      const primedNow = all.filter((h) => h.media.play.mock.calls.length > 0).length;
      expect(primedNow).toBe(37); // 40 minus the 3 chimes, which go first

      jest.advanceTimersByTime(999);
      expect(all.every((h) => h.media.play.mock.calls.length === 1)).toBe(true);
    });

    it('primes chimes before content clips', () => {
      const h = webHandle();
      const handles = handlesWith({ words: new Map([['w', h]]) });
      primeAudioHandles(handles);
      const chime = handles.chimes.correct as unknown as ReturnType<typeof webHandle>;
      expect(chime.media.play).toHaveBeenCalledTimes(1);
    });
  });
});
