import { useEffect } from 'react';
import { useGameShell } from './GameShellContext';

/**
 * Registers a callback on the shell's repeat button for the lifetime of the mechanic.
 * Overrides the default replayWord behaviour — used by syllable games that play a
 * syllable clip rather than a word clip on repeat.
 * Pass null to fall back to the shell's default replayWord.
 */
export function useShellRepeat(fn: (() => void) | null): void {
  const { setOnRepeat } = useGameShell();
  useEffect(() => {
    setOnRepeat(fn);
    return () => setOnRepeat(null);
  }, [fn, setOnRepeat]);
}
