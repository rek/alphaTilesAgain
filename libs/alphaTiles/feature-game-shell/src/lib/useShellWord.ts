import { useEffect } from 'react';
import { useGameShell } from './GameShellContext';

/**
 * Syncs the shell's reference word whenever the current word changes.
 * Encapsulates the setRefWord effect pattern common to all game mechanics.
 */
export function useShellWord(
  word: { wordInLOP: string; wordInLWC: string } | null | undefined,
): void {
  const { setRefWord } = useGameShell();
  const wordInLOP = word?.wordInLOP ?? null;
  const wordInLWC = word?.wordInLWC ?? null;
  useEffect(() => {
    setRefWord(
      wordInLOP != null && wordInLWC != null ? { wordInLOP, wordInLWC } : null,
    );
  }, [wordInLOP, wordInLWC, setRefWord]);
}
