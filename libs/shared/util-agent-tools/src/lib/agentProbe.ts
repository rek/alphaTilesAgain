export type ClipPlayed = { key: string; at: number };

/**
 * Facts only the running app knows (the audio gate opened, the last clip it
 * played). Writers call it inside `if (__DEV__)`; the dev agent tools read it.
 * Plain module state: not React, not persisted.
 */
const state: { audioUnlocked: boolean; clipsPlayed: number; lastClip: ClipPlayed | null } = {
  audioUnlocked: false,
  clipsPlayed: 0,
  lastClip: null,
};

export const agentProbe = {
  audioUnlocked: (): void => {
    state.audioUnlocked = true;
  },
  clipPlayed: (key: string): void => {
    state.clipsPlayed += 1;
    state.lastClip = { key, at: Date.now() };
  },
  snapshot: () => ({ ...state }),
  reset: (): void => {
    state.audioUnlocked = false;
    state.clipsPlayed = 0;
    state.lastClip = null;
  },
};
