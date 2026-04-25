import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from '@shared/util-i18n';
import { useLangAssets, usePrecompute } from '@alphaTiles/data-language-assets';
import { GameShellContainer } from '@alphaTiles/feature-game-shell';
import {
  parseWordIntoTilesPreliminary,
  buildTileHashMap,
  getMultitypeTiles,
} from '@shared/util-phoneme';
import { RomaniaScreen } from './RomaniaScreen';
import { filterWordsForTile } from './filterWordsForTile';
import type { RomaniaData } from './buildRomaniaData';
import type { LangAssets } from '@alphaTiles/data-language-assets';

type Word = LangAssets['words']['rows'][number];
type RouteParams = Record<string, string | string[] | undefined>;

function RomaniaGame(): React.JSX.Element {
  const assets = useLangAssets();
  const romaniaData = usePrecompute<RomaniaData>('romania');
  const { t } = useTranslation('chrome');

  const tileRows = assets.tiles.rows;
  const placeholderChar = assets.langInfo.find('Placeholder character') ?? '◌';
  const scanSetting = assets.settings.findInt('Game 001 Scan Setting', 1) as 1 | 2 | 3;
  const boldFocusTile = assets.settings.findBoolean(
    'In Game 001 (Romania) bold initial tiles when in focus? (boldInitialFocusTiles)',
    false,
  );

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
      return parsed ? parsed.map((tile) => tile.base) : [];
    },
    [tileMap, multitypeTiles, placeholderChar],
  );

  // All tiles that have at least one word in the precompute
  const tilesWithWords = useMemo(
    () => tileRows.filter((tile) => (romaniaData[tile.base]?.length ?? 0) > 0),
    [tileRows, romaniaData],
  );

  const [tileIndex, setTileIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);

  const focusTile = tilesWithWords[tileIndex] ?? null;

  const wordsForTile = useMemo(
    () => (focusTile ? (romaniaData[focusTile.base] ?? []) : []),
    [focusTile, romaniaData],
  );

  const filteredWords = useMemo(
    () =>
      focusTile
        ? filterWordsForTile(wordsForTile, scanSetting, focusTile.base, parseWord)
        : [],
    [wordsForTile, scanSetting, focusTile, parseWord],
  );

  const currentWord = filteredWords[wordIndex] ?? null;

  const wordTiles = useMemo(
    () => (currentWord ? parseWord(currentWord) : []),
    [currentWord, parseWord],
  );

  // Reset wordIndex when tile changes
  useEffect(() => {
    setWordIndex(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileIndex]);

  const onNext = useCallback(() => {
    if (wordIndex < filteredWords.length - 1) {
      setWordIndex((i) => i + 1);
    } else {
      // All words for this tile seen — advance to next tile
      if (tileIndex < tilesWithWords.length - 1) {
        setTileIndex((i) => i + 1);
      } else {
        // All tiles exhausted — let the shell handle navigation via back/advance
        setTileIndex(0);
        setWordIndex(0);
      }
    }
    // Romania is NO_TRACKER_COUNTRY — never call shell.incrementPointsAndTracker
  }, [wordIndex, filteredWords.length, tileIndex, tilesWithWords.length]);

  if (tilesWithWords.length === 0 || !focusTile || !currentWord) {
    return (
      <RomaniaScreen
        focusTileText="-"
        wordTiles={[]}
        wordLabel=""
        boldFocusTile={false}
        focusTileBase=""
        nextLabel={t('next', 'Next')}
        onNext={() => undefined}
      />
    );
  }

  return (
    <RomaniaScreen
      focusTileText={focusTile.base}
      wordTiles={wordTiles}
      wordLabel={currentWord.wordInLOP}
      boldFocusTile={boldFocusTile}
      focusTileBase={focusTile.base}
      nextLabel={t('next', 'Next')}
      onNext={onNext}
    />
  );
}

export function RomaniaContainer(props: RouteParams): React.JSX.Element {
  const assets = useLangAssets();
  const gameNumber = parseInt((props.gameNumber as string) ?? '1', 10);
  const game = assets.games.rows[gameNumber - 1];
  const instructionAudioId = game?.instructionAudio;
  const hasInstruction =
    !!instructionAudioId && instructionAudioId in assets.audio.instructions;

  return (
    <GameShellContainer
      showInstructionsButton={hasInstruction}
      instructionAudioId={hasInstruction ? instructionAudioId : undefined}
      confirmOnBack={false}
    >
      <RomaniaGame />
    </GameShellContainer>
  );
}
