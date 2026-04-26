import { useEffect } from 'react';
import { useGameShell } from './GameShellContext';

/**
 * Registers a callback on the shell's advance arrow for the lifetime of the mechanic.
 * Pass null to leave the advance arrow unwired (button still shows but does nothing).
 */
export function useShellAdvance(fn: (() => void) | null): void {
  const { setOnAdvance } = useGameShell();
  useEffect(() => {
    setOnAdvance(fn);
    return () => setOnAdvance(null);
  }, [fn, setOnAdvance]);
}
