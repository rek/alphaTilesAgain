/**
 * Opaque wrapper around expo-audio's AudioPlayer.
 * Internal to data-audio — callers use AudioHandles, never SoundHandle directly.
 *
 * expo-audio (0.4.x) exposes AudioPlayer from createAudioPlayer().
 * duration is in seconds; we multiply by 1000 when caching durationMs.
 */
import type { AudioPlayer } from 'expo-audio';

export type SoundHandle = AudioPlayer;
