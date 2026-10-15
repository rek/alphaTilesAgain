import type { LangAssets } from '@alphaTiles/data-language-pack';

/** Taiwan needs at least N hanzi with stroke data; below this the door is hidden. */
const MIN_STROKE_TILES = 5;
const DISABLE_SETTING = 'Enable stroke order game';

/** Whether Taiwan (stroke-order) doors are playable in this pack. */
export function isStrokeGameEnabled(pack: Pick<LangAssets, 'settings' | 'strokes'>) {
  if (Object.keys(pack.strokes).length < MIN_STROKE_TILES) return false;
  const value = (pack.settings.find(DISABLE_SETTING) ?? '').trim().toLowerCase();
  return value !== 'false' && value !== 'no' && value !== '0';
}
