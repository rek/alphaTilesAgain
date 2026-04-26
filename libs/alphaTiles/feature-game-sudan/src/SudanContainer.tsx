/**
 * Container for the Sudan tile/syllable audio browser.
 *
 * Sudan is in NO_TRACKER_COUNTRIES — does NOT call the points/tracker API.
 * Port of Sudan.java; see openspec/changes/game-sudan/design.md.
 *
 * State:
 *   - page: number (0-indexed)
 *   - disabled: boolean (true while audio plays — gates grid + options row)
 *
 * Variant from `syllableGame` route param:
 *   - 'T' (or anything not 'S'): tile variant — 63/page, type-coloured
 *   - 'S': syllable variant — 35/page, syllable.color-coloured
 *
 * Tap → playTile / playSyllable. Disabled clears when the awaited play resolves.
 * Pagination prev/next bounded; visibility derived in screen from page/pageCount.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useLangAssets, usePrecompute } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
} from '@alphaTiles/feature-game-shell';
import { SudanScreen } from './SudanScreen';
import type { SudanCell } from './SudanScreen';
import { tileColor } from './tileColor';
import { syllableColor } from './syllableColor';
import type { SudanData } from './sudanPreProcess';

type RouteParams = Record<string, string | string[] | undefined>;

const FALLBACK_COLOR = '#9E9E9E';

function SudanGame({ syllableGame }: { syllableGame: string }): React.JSX.Element {
  const shell = useGameShell();
  const audio = useAudio();
  const assets = useLangAssets();
  const data = usePrecompute<SudanData>('sudan');

  const isSyllable = syllableGame === 'S';
  const hasSyllableAudio = useMemo(
    () => assets.settings.findBoolean('Has syllable audio', false),
    [assets.settings],
  );
  const colorList = assets.colors.hexByIndex;

  const pages = isSyllable ? data.syllablePages : data.tilePages;
  const pageCount = pages.length;

  const [page, setPage] = useState(0);
  const [disabled, setDisabled] = useState(false);

  // Build cell view-models for the current page.
  const cells: SudanCell[] = useMemo(() => {
    const current = pages[page] ?? [];
    if (isSyllable) {
      return current.map((s) => {
        const syl = s as { syllable: string; color: string };
        const color = syllableColor(syl.color, colorList) ?? FALLBACK_COLOR;
        return { text: syl.syllable, color, tappable: hasSyllableAudio };
      });
    }
    return current.map((t) => {
      const tile = t as { base: string; typeOfThisTileInstance: string };
      const color = tileColor(tile.typeOfThisTileInstance, colorList) ?? FALLBACK_COLOR;
      return { text: tile.base, color, tappable: true };
    });
  }, [pages, page, isSyllable, colorList, hasSyllableAudio]);

  const onTilePress = useCallback(
    async (index: number) => {
      if (disabled) return;
      const tile = data.tilePages[page]?.[index];
      if (!tile) return;
      setDisabled(true);
      shell.setInteractionLocked(true);
      try {
        await audio.playTile(tile.audioForThisTileType);
      } finally {
        setDisabled(false);
        shell.setInteractionLocked(false);
      }
    },
    [disabled, data.tilePages, page, audio, shell],
  );

  const onSyllablePress = useCallback(
    async (index: number) => {
      if (disabled) return;
      if (!hasSyllableAudio) return; // Java: setClickable(false) for whole page.
      const syl = data.syllablePages[page]?.[index];
      if (!syl) return;
      setDisabled(true);
      shell.setInteractionLocked(true);
      try {
        await audio.playSyllable(syl.audioName);
      } finally {
        setDisabled(false);
        shell.setInteractionLocked(false);
      }
    },
    [disabled, hasSyllableAudio, data.syllablePages, page, audio, shell],
  );

  const onPrev = useCallback(() => {
    setPage((p) => (p > 0 ? p - 1 : p));
  }, []);

  const onNext = useCallback(() => {
    setPage((p) => (p < pageCount - 1 ? p + 1 : p));
  }, [pageCount]);

  if (isSyllable) {
    return (
      <SudanScreen
        variant="S"
        syllables={cells}
        page={page}
        pageCount={pageCount}
        disabled={disabled}
        onPrev={onPrev}
        onNext={onNext}
        onSyllable={onSyllablePress}
      />
    );
  }

  return (
    <SudanScreen
      variant="T"
      tiles={cells}
      page={page}
      pageCount={pageCount}
      disabled={disabled}
      onPrev={onPrev}
      onNext={onNext}
      onTile={onTilePress}
    />
  );
}

export function SudanContainer(props: RouteParams): React.JSX.Element {
  const assets = useLangAssets();
  const gameNumber = parseInt((props.gameNumber as string) ?? '1', 10);
  const syllableGame = (props.syllableGame as string) ?? '';
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
      <SudanGame syllableGame={syllableGame} />
    </GameShellContainer>
  );
}
