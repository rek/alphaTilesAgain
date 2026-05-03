import { useLangAssets } from '@alphaTiles/data-language-assets';
import type { StrokeData } from '@alphaTiles/data-language-pack';

export function useStrokes(): Record<string, StrokeData> {
  return useLangAssets().strokes;
}
