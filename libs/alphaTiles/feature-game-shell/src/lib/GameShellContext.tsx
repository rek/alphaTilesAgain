/**
 * Context shared between GameShellContainer and its mechanic children.
 * Mechanics consume this via useGameShell() — they never import the store directly.
 *
 * See design.md §D2 — everything a mechanic needs from the shell without
 * reaching into the store directly.
 */

import React, { createContext, useContext } from 'react';
import type { ProgressEntry } from '@alphaTiles/data-progress';

export type GameShellContextValue = {
  /**
   * Call when the player answers correctly or the mechanic records a point.
   * `points` defaults to 1; pass a higher value for games that award more
   * (e.g. Italy lotería awards 4). Tracker still increments by 1 per call.
   */
  incrementPointsAndTracker: (isCorrect: boolean, points?: number) => void;
  /** Replay the current reference word audio. */
  replayWord: () => void;
  /** True while audio is playing or another lock is held. */
  interactionLocked: boolean;
  /** Mechanics set this to block interaction during animation etc. */
  setInteractionLocked: (locked: boolean) => void;
  /** Current reference word identifier (wordInLWC for audio, wordInLOP for parsing). */
  refWord: { wordInLOP: string; wordInLWC: string } | null;
  setRefWord: (word: { wordInLOP: string; wordInLWC: string } | null) => void;
  /** Current progress entry for this game/stage combo. */
  progressEntry: ProgressEntry;
  /** Unique ID used to key the progress entry. */
  gameUniqueId: string;
  /** Register a callback to fire when the shell's advance arrow is pressed. Pass null to unregister. */
  setOnAdvance: (fn: (() => void) | null) => void;
  /** Register a callback to fire when the shell's repeat button is pressed. Pass null to fall back to replayWord. */
  setOnRepeat: (fn: (() => void) | null) => void;
};

export const GameShellContext = createContext<GameShellContextValue | null>(null);

export function GameShellContextProvider({
  value,
  children,
}: {
  value: GameShellContextValue;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <GameShellContext.Provider value={value}>
      {children}
    </GameShellContext.Provider>
  );
}

export function useGameShell(): GameShellContextValue {
  const ctx = useContext(GameShellContext);
  if (ctx === null) {
    throw new Error('useGameShell must be called inside <GameShellContainer>');
  }
  return ctx;
}
