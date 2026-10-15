/**
 * createPackSpeech — the one way games speak pack content.
 *
 * Interface:
 *   speak(item)      play a tile / word / syllable / instruction; returns the
 *                    expected playback ms (undefined = unknown or silent).
 *                    Cancels any speech still in flight first.
 *   durationOf(item) the ms speak(item) would return, without playing.
 *   stop()           cancel in-flight speech (pending chain steps).
 *
 * Behind it (planSpeech): which audio map and id each item uses, the word →
 * syllable-chain fallback, the syllable → containing-word fallback, chain gap
 * timing, and warn-once for items with no playable clip.
 *
 * Multi-clip speech (syllable chain) holds the caller's interaction lock for
 * its lifetime via `holdLock` (returns a release fn); release runs when the
 * chain ends or is cancelled. Single clips never lock.
 *
 * Adapters: production = usePackSpeech (AudioHandles + player pool);
 * tests = an in-memory clip table + recording `play`.
 */
import { planSpeech } from './planSpeech';
import type { ClipCategory, ClipLookup, SpeechItem } from './planSpeech';

type PackSpeechDeps = {
  pack: Parameters<typeof planSpeech>[1];
  clip: ClipLookup;
  play: (category: ClipCategory, id: string) => void;
  holdLock?: () => () => void;
  /** Dev warning for unspeakable items; called once per item. */
  warn?: (message: string) => void;
};

function itemLabel(item: SpeechItem): string {
  if ('instruction' in item) return `instruction "${item.instruction}"`;
  if ('tile' in item) return `tile "${item.tile.base}"`;
  if ('syllable' in item) return `syllable "${item.syllable.syllable}"`;
  return `word "${item.word.wordInLWC}" (${item.word.wordInLOP})`;
}

export function createPackSpeech({ pack, clip, play, holdLock, warn }: PackSpeechDeps) {
  let timers: ReturnType<typeof setTimeout>[] = [];
  let release: (() => void) | null = null;
  const warned = new Set<string>();

  const stop = (): void => {
    timers.forEach(clearTimeout);
    timers = [];
    const r = release;
    release = null;
    r?.();
  };

  const durationOf = (item: SpeechItem): number | undefined => planSpeech(item, pack, clip).ms;

  const speak = (item: SpeechItem): number | undefined => {
    stop();
    const plan = planSpeech(item, pack, clip);
    if (plan.route === 'silent') {
      const label = itemLabel(item);
      if (!warned.has(label)) {
        warned.add(label);
        warn?.(`[pack-speech] no playable clip for ${label}`);
      }
      return undefined;
    }
    const [first, ...rest] = plan.steps;
    play(first.category, first.id);
    if (rest.length === 0) return plan.ms;

    release = holdLock?.() ?? null;
    timers = rest.map((s) => setTimeout(() => play(s.category, s.id), s.atMs));
    timers.push(
      setTimeout(() => {
        timers = [];
        const r = release;
        release = null;
        r?.();
      }, plan.ms ?? 0),
    );
    return plan.ms;
  };

  return { speak, durationOf, stop };
}
