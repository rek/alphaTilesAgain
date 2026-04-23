/**
 * Jest stub for expo-audio.
 * Tests that import this lib will have individual mock implementations
 * set via jest.mock('expo-audio', ...) or by spying on the exports here.
 *
 * This file provides the module shape; individual tests override implementations.
 */

export const createAudioPlayer = jest.fn();
export const setAudioModeAsync = jest.fn().mockResolvedValue(undefined);
