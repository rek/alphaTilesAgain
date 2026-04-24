import { create } from 'zustand';
import type { AudioHandles } from '@alphaTiles/data-audio';

type AudioHandlesState = {
  handles: AudioHandles | null;
  setHandles: (h: AudioHandles) => void;
};

export const useAudioHandlesStore = create<AudioHandlesState>((set) => ({
  handles: null,
  setHandles: (handles) => set({ handles }),
}));
