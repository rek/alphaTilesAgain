/**
 * Container for the Sudan tile/syllable audio browser.
 *
 * Sudan is in NO_TRACKER_COUNTRIES — does NOT call the points/tracker API.
 * Port of Sudan.java; see openspec/changes/game-sudan/design.md.
 *
 * State:
 *   - page: number (0-indexed)
 *   - disabled: always false (speak starts synchronously; kept for the presenter)
 *
 * Variant from the routed Door (`aa_games.txt` `SyllOrTile`):
 *   - 'T' (or anything not 'S'): tile variant — 63/page, type-coloured
 *   - 'S': syllable variant — 35/page, syllable.color-coloured
 *
 * Tap → shell.speak({ tile }) / speak({ syllable }).
 * Pagination prev/next bounded; visibility derived in screen from page/pageCount.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@shared/util-i18n';
import { useLangAssets, usePrecompute } from '@alphaTiles/data-language-assets';
import {
  GameShellContainer,
  useGameShell,
} from '@alphaTiles/feature-game-shell';
import type { GameShellIcons } from '@alphaTiles/feature-game-shell';
import { SudanScreen } from './SudanScreen';
import type { SudanCell } from './SudanScreen';
import { tileColor } from './tileColor';
import { syllableColor } from './syllableColor';
import type { SudanData } from './sudanPreProcess';

type RouteParams = Record<string, string | string[] | GameShellIcons | undefined> & {
  icons?: GameShellIcons;
};

const FALLBACK_COLOR = '#9E9E9E';

function SudanGame({ variant }: { variant: 'T' | 'S' }): React.JSX.Element {
  const shell = useGameShell();
  const assets = useLangAssets();
  const data = usePrecompute<SudanData>('sudan');
  const { t } = useTranslation();

  const a11yLabels = useMemo(() => ({
    previousPage: t('chrome:a11y.previous_page'),
    nextPage: t('chrome:a11y.next_page'),
  }), [t]);

  const isSyllable = variant === 'S';
  const hasSyllableAudio = useMemo(
    () => assets.settings.findBoolean('Has syllable audio', false),
    [assets.settings],
  );
  const colorList = assets.colors.hexByIndex;

  const pages = isSyllable ? data.syllablePages : data.tilePages;
  const pageCount = pages.length;

  const [page, setPage] = useState(0);
  const disabled = false;

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

  // speak() starts playback synchronously, so there is no in-flight window
  // to gate; `disabled` stays false (kept for the presenter contract).
  const onTilePress = useCallback(
    (index: number) => {
      const tile = data.tilePages[page]?.[index];
      if (tile) shell.speak({ tile });
    },
    [data.tilePages, page, shell],
  );

  const onSyllablePress = useCallback(
    (index: number) => {
      if (!hasSyllableAudio) return; // Java: setClickable(false) for whole page.
      const syl = data.syllablePages[page]?.[index];
      if (syl) shell.speak({ syllable: syl });
    },
    [hasSyllableAudio, data.syllablePages, page, shell],
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
        a11yLabels={a11yLabels}
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
      a11yLabels={a11yLabels}
    />
  );
}

export function SudanContainer(props: RouteParams): React.JSX.Element {
  return (
    <GameShellContainer confirmOnBack={false} icons={props.icons}>
      {(door) => <SudanGame variant={door.variant} />}
    </GameShellContainer>
  );
}
