/**
 * usePackSpeech — production adapter for createPackSpeech.
 *
 * Wires pack speech to the preloaded clips (AudioHandles source + duration
 * maps) and the bounded player pool. Returns a stable { speak, durationOf,
 * stop } for the component's lifetime; in-flight speech is cancelled on
 * unmount. Must be called inside <AudioProvider>.
 *
 * `pack` = the lang pack's word + syllable rows (fallback routes need them).
 * `holdLock` = optional interaction lock held while a syllable chain plays
 * (the game shell passes one; screens without a lock omit it).
 */
import { useContext, useRef } from 'react';
import { useMountEffect } from '@shared/util-hooks';
import { AudioContext } from './AudioContext';
import type { AudioHandles } from './AudioHandles';
import { createPackSpeech } from './createPackSpeech';
import type { ClipCategory } from './planSpeech';
import { playHandle } from './playHandle';

type Pack = Parameters<typeof createPackSpeech>[0]['pack'];

const SOURCES = {
  tile: 'tiles',
  word: 'words',
  syllable: 'syllables',
  instruction: 'instructions',
} as const satisfies Record<ClipCategory, keyof AudioHandles['durations']>;

export function usePackSpeech(pack: Pack, holdLock?: () => () => void) {
  const { handles } = useContext(AudioContext);
  // Latest inputs, read at call time so the speech instance stays stable.
  const live = useRef({ handles, pack, holdLock });
  live.current = { handles, pack, holdLock };

  const speechRef = useRef<ReturnType<typeof createPackSpeech> | null>(null);
  if (speechRef.current === null) {
    speechRef.current = createPackSpeech({
      pack: {
        get words() { return live.current.pack.words; },
        get syllables() { return live.current.pack.syllables; },
      },
      clip: (category, id) => {
        const h = live.current.handles;
        const source = h?.[SOURCES[category]].get(id);
        if (!h || source === undefined || source === null) return null;
        return { ms: h.durations[SOURCES[category]].get(id) };
      },
      play: (category, id) => {
        const h = live.current.handles;
        const source = h?.[SOURCES[category]].get(id);
        if (!h || source === undefined || source === null) return;
        try {
          void playHandle(h.pool.acquire(`${category}:${id}`, source));
        } catch (err) {
          if (__DEV__) {
            console.warn(
              `[data-audio] failed to create player for ${category}:${id}`,
              err instanceof Error ? err.message : String(err),
            );
          }
        }
      },
      holdLock: () => live.current.holdLock?.() ?? (() => undefined),
      warn: (message) => {
        if (__DEV__) console.warn(message);
      },
    });
  }
  const speech = speechRef.current;

  // Unmount: cancel pending chain steps.
  useMountEffect(() => () => speech.stop());

  return speech;
}
