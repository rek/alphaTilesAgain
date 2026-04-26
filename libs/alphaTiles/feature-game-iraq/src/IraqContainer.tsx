/**
 * Container for the Iraq tile-explorer (non-scored reference screen).
 *
 * IraqContainer wraps GameShellContainer; IraqGame is the inner component
 * that calls useGameShell() and owns all game state.
 *
 * Iraq is in NO_TRACKER_COUNTRIES — we MUST NOT call
 * shell.incrementPointsAndTracker. There is no win/lose state.
 *
 * State machine per tile tap (Iraq.java:236-446):
 *   1. Set isAnimating + interactionLocked (re-tap guard).
 *   2. Play tile audio (fire-and-forget Promise).
 *   3. After tileAudioDuration + 500 ms → resolve a word for the tile and
 *      paint the white overlay (text + image). Skip overlay if no word.
 *   4. After 2000 ms → restore tile, clear overlay, unlock interaction.
 *   5. Re-taps during animation are ignored.
 *
 * Pagination cancels in-flight timers (RN-specific safety; Java arrows are
 * unclickable while animating).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
} from '@alphaTiles/feature-game-shell';
import type { GameShellIcons } from '@alphaTiles/feature-game-shell';
import {
  buildTileHashMap,
  getMultitypeTiles,
  parseWordIntoTilesPreliminary,
} from '@shared/util-phoneme';
import type { LangAssets } from '@alphaTiles/data-language-assets';
import { IraqScreen } from './IraqScreen';
import type { IraqOverlay, IraqTileView } from './IraqScreen';
import { buildIraqTileList } from './buildIraqTileList';
import {
  IRAQ_PAGE_SIZE,
  pageCount as computePageCount,
  tilesForPage,
} from './iraqPagination';
import { findWordForTile } from './findWordForTile';
import type { ScanSetting } from './findWordForTile';
import { resolveIconicWordOverride } from './iconicWordOverride';
import { stripInstructionCharacters } from './stripInstructionCharacters';

type Word = LangAssets['words']['rows'][number];
type TileRow = LangAssets['tiles']['rows'][number];

type RouteParams = Record<string, string | string[] | undefined> & {
  icons?: GameShellIcons;
};

/** Trailing buffer after audio completes before painting the word overlay (Iraq.java:440). */
const AUDIO_TRAIL_MS = 500;
/** Duration the overlay stays before reverting (Iraq.java:438). */
const OVERLAY_HOLD_MS = 2000;
/** Fallback when getTileDuration returns undefined (no native duration metadata). */
const DEFAULT_TILE_DURATION_MS = 800;

const PALETTE_FALLBACK = ['#1565C0', '#43A047', '#E53935', '#FB8C00', '#8E24AA'];

function IraqGame({ challengeLevel }: { challengeLevel: number }): React.JSX.Element {
  const shell = useGameShell();
  const audio = useAudio();
  const assets = useLangAssets();

  const tileRows = assets.tiles.rows;
  const wordRows = assets.words.rows;
  const placeholderChar = assets.langInfo.find('Placeholder character') ?? '◌';
  const scriptDirection = assets.langInfo.find('Script direction') ?? 'LTR';
  const rtl = scriptDirection.toUpperCase() === 'RTL';

  const scanSetting = useMemo(
    () => assets.settings.findInt('Game 001 Scan Setting', 1) as ScanSetting,
    [assets.settings],
  );

  const differentiatesTileTypes = useMemo(
    () => assets.settings.findBoolean('Differentiates types of multitype symbols', false),
    [assets.settings],
  );

  // Pre-build tile list (filter + sort + dedup).
  const sortedTiles = useMemo(
    () => buildIraqTileList({ tiles: tileRows, differentiatesTileTypes }),
    [tileRows, differentiatesTileTypes],
  );

  const totalTiles = sortedTiles.length;
  const numPages = computePageCount(totalTiles);

  // Word parser memoised once per tileRows change — same shape used in Romania.
  const tileMap = useMemo(
    () => buildTileHashMap(tileRows, placeholderChar),
    [tileRows, placeholderChar],
  );
  const multitypeTiles = useMemo(() => getMultitypeTiles(tileRows), [tileRows]);
  const parseWord = useCallback(
    (word: Word): string[] => {
      const parsed = parseWordIntoTilesPreliminary(
        word.wordInLOP,
        word.mixedDefs,
        tileMap,
        multitypeTiles,
        placeholderChar,
      );
      return parsed ? parsed.map((t) => t.base) : [];
    },
    [tileMap, multitypeTiles, placeholderChar],
  );

  const colorList = assets.colors.hexByIndex.length > 0
    ? assets.colors.hexByIndex
    : PALETTE_FALLBACK;

  const [page, setPage] = useState(0);
  const [overlay, setOverlay] = useState<IraqOverlay | null>(null);

  // Refs for in-flight timers + animation guard
  const isAnimatingRef = useRef(false);
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const clearTimers = useCallback(() => {
    if (audioTimerRef.current) {
      clearTimeout(audioTimerRef.current);
      audioTimerRef.current = null;
    }
    if (restoreTimerRef.current) {
      clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  // Tile views for current page
  const tilesOnPage: IraqTileView[] = useMemo(() => {
    const pageTiles = tilesForPage(sortedTiles, page);
    return pageTiles.map((t, indexOnPage) => {
      const globalIndex = page * IRAQ_PAGE_SIZE + indexOnPage;
      return {
        text: t.base,
        bgColor: colorList[globalIndex % colorList.length],
      };
    });
  }, [sortedTiles, page, colorList]);

  const onTilePress = useCallback(
    (indexOnPage: number) => {
      if (isAnimatingRef.current) return; // Iraq.java:238-241 isAnimating guard
      const tile: TileRow | undefined = sortedTiles[page * IRAQ_PAGE_SIZE + indexOnPage];
      if (!tile) return;

      isAnimatingRef.current = true;
      shell.setInteractionLocked(true);

      // 1. Play tile audio (fire-and-forget). Java uses tile.audioForThisTileType.
      const audioId = tile.audioName;
      if (audioId) {
        audio.playTile(audioId);
      }

      // 2. Resolve the word for this tile (CL2 iconicWord override → scanSetting fallback).
      let chosenWord: Word | null = resolveIconicWordOverride(tile, wordRows, challengeLevel);
      if (chosenWord === null) {
        chosenWord = findWordForTile({
          tileBase: tile.base,
          words: wordRows,
          scanSetting,
          parseWord,
        });
      }

      const tileDurationMs =
        audio.getTileDuration(audioId) ?? DEFAULT_TILE_DURATION_MS;

      // 3. After audio + 500 ms — paint overlay (or skip if no word).
      audioTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        if (chosenWord !== null) {
          const wordText = stripInstructionCharacters(chosenWord.wordInLOP);
          const wordImage = assets.images.words[chosenWord.wordInLWC] as
            | ImageSourcePropType
            | undefined;
          setOverlay({ tileIndex: indexOnPage, wordText, wordImage });
        }

        // 4. After 2000 ms — restore tile and unlock interaction.
        restoreTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          setOverlay(null);
          isAnimatingRef.current = false;
          shell.setInteractionLocked(false);
        }, OVERLAY_HOLD_MS);
      }, tileDurationMs + AUDIO_TRAIL_MS);
    },
    [
      sortedTiles, page, audio, wordRows, scanSetting, parseWord,
      challengeLevel, assets.images.words, shell,
    ],
  );

  const onPrev = useCallback(() => {
    if (isAnimatingRef.current) return;
    if (page <= 0) return;
    clearTimers();
    setOverlay(null);
    isAnimatingRef.current = false;
    shell.setInteractionLocked(false);
    setPage((p) => Math.max(0, p - 1));
  }, [page, clearTimers, shell]);

  const onNext = useCallback(() => {
    if (isAnimatingRef.current) return;
    if (page >= numPages - 1) return;
    clearTimers();
    setOverlay(null);
    isAnimatingRef.current = false;
    shell.setInteractionLocked(false);
    setPage((p) => Math.min(numPages - 1, p + 1));
  }, [page, numPages, clearTimers, shell]);

  return (
    <IraqScreen
      tilesOnPage={tilesOnPage}
      overlay={overlay}
      page={page}
      pageCount={numPages}
      interactionLocked={shell.interactionLocked}
      rtl={rtl}
      onTilePress={onTilePress}
      onPrev={onPrev}
      onNext={onNext}
    />
  );
}

export function IraqContainer(props: RouteParams): React.JSX.Element {
  const assets = useLangAssets();
  const gameNumber = parseInt((props.gameNumber as string) ?? '1', 10);
  const rawLevel = parseInt((props.challengeLevel as string) ?? '1', 10);
  const challengeLevel = rawLevel >= 1 && rawLevel <= 3 ? rawLevel : 1;
  const game = assets.games.rows[gameNumber - 1];
  const instructionAudioId = game?.instructionAudio;
  const hasInstruction =
    !!instructionAudioId && instructionAudioId in assets.audio.instructions;

  return (
    <GameShellContainer
      showInstructionsButton={hasInstruction}
      instructionAudioId={hasInstruction ? instructionAudioId : undefined}
      confirmOnBack={false}
      icons={props.icons}
    >
      <IraqGame challengeLevel={challengeLevel} />
    </GameShellContainer>
  );
}
