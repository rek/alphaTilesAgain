import { useMemo } from 'react';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { buildGameUniqueId } from '@alphaTiles/data-progress';
import { countryToClassKey } from '@alphaTiles/util-scoring';
import { deriveVisual } from './deriveVisual';
import { useTrackerCounts } from './useTrackerCounts';
import type { LangAssets } from '@alphaTiles/data-language-assets';

const NO_RIGHT_WRONG_FALLBACK = ['romania', 'sudan', 'malaysia', 'iraq'];
const MIN_DOORS_PER_PAGE = 6;
const MAX_DOORS_PER_PAGE = 40;
const DEFAULT_DOORS_PER_PAGE = 40;

/** Taiwan needs at least N hanzi with stroke data; below this the tile is hidden. */
const MIN_STROKE_TILES = 5;
const TAIWAN_DISABLE_SETTING = 'Enable stroke order game';

export type DoorData = {
  index: number;
  classKey: string;
  challengeLevel: number;
  colorHex: string;
  noRightWrong: boolean;
  trackerCount: number;
  visual: 'not-started' | 'in-process' | 'mastery';
  textColorHex: string | undefined;
};

type BuildDoorsOpts = {
  gameRows: LangAssets['games']['rows'];
  colorsHex: LangAssets['colors']['hexByIndex'];
  doorsPerPageSetting: number;
  trackerCounts: Record<string, number>;
  playerId: string | null;
  page: number;
  /** Filter predicate: return false to hide a game row from the menu. Defaults to "show all". */
  isGameEnabled?: (classKey: string) => boolean;
};

export function buildDoors({
  gameRows,
  colorsHex,
  doorsPerPageSetting,
  trackerCounts,
  playerId,
  page,
  isGameEnabled,
}: BuildDoorsOpts): { pageDoors: DoorData[]; allDoors: DoorData[]; totalPages: number; doorsPerPage: number } {
  const doorsPerPage = Math.min(MAX_DOORS_PER_PAGE, Math.max(MIN_DOORS_PER_PAGE, doorsPerPageSetting));

  const filteredRows = isGameEnabled
    ? gameRows.filter((g) => isGameEnabled(countryToClassKey(g.country)))
    : gameRows;

  const allDoors: DoorData[] = filteredRows.map((game, i) => {
    const classKey = countryToClassKey(game.country);
    const colorIndex = parseInt(game.color, 10) || 0;
    const colorHex = colorsHex[colorIndex] ?? '#666666';
    const noRightWrong = NO_RIGHT_WRONG_FALLBACK.includes(classKey);
    const syllableGame = game.syllOrTile === 'S' ? 'S' : '';
    const stage = game.stagesIncluded === '-' ? 1 : parseInt(game.stagesIncluded, 10) || 1;
    const key = playerId
      ? buildGameUniqueId({ country: game.country, challengeLevel: game.challengeLevel, playerId, syllableGame, stage })
      : '';
    const trackerCount = trackerCounts[key] ?? 0;
    const door: DoorData = {
      index: i + 1,
      classKey,
      challengeLevel: game.challengeLevel,
      colorHex,
      noRightWrong,
      trackerCount,
      visual: 'not-started',
      textColorHex: undefined,
    };
    door.visual = deriveVisual(door);
    door.textColorHex = noRightWrong ? '#000000' : undefined;
    return door;
  });

  const totalPages = Math.max(1, Math.ceil(allDoors.length / doorsPerPage));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * doorsPerPage;
  const pageDoors = allDoors.slice(start, start + doorsPerPage);

  return { pageDoors, allDoors, totalPages, doorsPerPage };
}

export function useDoors(
  playerId: string | null,
  page: number,
): { pageDoors: DoorData[]; allDoors: DoorData[]; totalPages: number; doorsPerPage: number } {
  const assets = useLangAssets();
  const trackerCounts = useTrackerCounts(playerId);

  const taiwanEnabled = useMemo(() => {
    const strokeCount = Object.keys(assets.strokes).length;
    if (strokeCount < MIN_STROKE_TILES) return false;
    const settingValue = (assets.settings.find(TAIWAN_DISABLE_SETTING) ?? '').trim().toLowerCase();
    if (settingValue === 'false' || settingValue === 'no' || settingValue === '0') return false;
    return true;
  }, [assets.strokes, assets.settings]);

  const isGameEnabled = useMemo(
    () => (classKey: string) => (classKey === 'taiwan' ? taiwanEnabled : true),
    [taiwanEnabled],
  );

  return useMemo(
    () =>
      buildDoors({
        gameRows: assets.games.rows,
        colorsHex: assets.colors.hexByIndex,
        doorsPerPageSetting: assets.settings.findInt('Doors per page', DEFAULT_DOORS_PER_PAGE),
        trackerCounts,
        playerId,
        page,
        isGameEnabled,
      }),
    [assets.games.rows, assets.settings, assets.colors.hexByIndex, trackerCounts, playerId, page, isGameEnabled],
  );
}
