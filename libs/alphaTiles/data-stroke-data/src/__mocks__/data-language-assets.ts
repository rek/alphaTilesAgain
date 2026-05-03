import type { StrokeData } from '@alphaTiles/data-language-pack';

let mockStrokes: Record<string, StrokeData> = {};

export function __setMockStrokes(strokes: Record<string, StrokeData>): void {
  mockStrokes = strokes;
}

export function useLangAssets() {
  return { strokes: mockStrokes };
}
