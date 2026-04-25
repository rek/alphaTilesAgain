import { useMemo } from 'react';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { buildGameUniqueId } from '@alphaTiles/data-progress';
import { deriveVisual } from './deriveVisual';
import { useTrackerCounts } from './useTrackerCounts';
import type { LangAssets } from '@alphaTiles/data-language-assets';

const NO_RIGHT_WRONG_FALLBACK = ['romania', 'sudan', 'malaysia', 'iraq'];
const MIN_DOORS_PER_PAGE = 6;
const MAX_DOORS_PER_PAGE = 999;
const DEFAULT_DOORS_PER_PAGE = 999;

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
};

export function buildDoors({
  gameRows,
  colorsHex,
  doorsPerPageSetting,
  trackerCounts,
  playerId,
  page,
}: BuildDoorsOpts): { pageDoors: DoorData[]; totalPages: number; doorsPerPage: number } {
  const doorsPerPage = Math.min(MAX_DOORS_PER_PAGE, Math.max(MIN_DOORS_PER_PAGE, doorsPerPageSetting));

  const allDoors: DoorData[] = gameRows.map((game, i) => {
    const classKey = game.country.toLowerCase();
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

  return { pageDoors, totalPages, doorsPerPage };
}

export function useDoors(
  playerId: string | null,
  page: number,
): { pageDoors: DoorData[]; totalPages: number; doorsPerPage: number } {
  const assets = useLangAssets();
  const trackerCounts = useTrackerCounts(playerId);

  return useMemo(
    () =>
      buildDoors({
        gameRows: assets.games.rows,
        colorsHex: assets.colors.hexByIndex,
        doorsPerPageSetting: assets.settings.findInt('Doors per page', DEFAULT_DOORS_PER_PAGE),
        trackerCounts,
        playerId,
        page,
      }),
    [assets.games.rows, assets.settings, assets.colors.hexByIndex, trackerCounts, playerId, page],
  );
}
