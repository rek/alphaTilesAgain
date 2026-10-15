/**
 * Container for the Malaysia non-scored word browser.
 *
 * Outer:  <MalaysiaContainer> wraps <GameShellContainer> (chrome + i18n).
 * Inner:  <MalaysiaGame> consumes useGameShell() (speak) / useLangAssets()
 *         and owns the page state. NO_TRACKER guard: this container MUST NOT
 *         call shell.incrementPointsAndTracker (Malaysia is in
 *         NO_TRACKER_COUNTRIES; spec ADDED Requirement: NO_TRACKER Guard).
 *
 * Port of Malaysia.java — see openspec/changes/game-malaysia/design.md for the
 * full mapping table.
 */
import React, { useCallback, useMemo, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import {
  useLangAssets,
  usePrecompute,
} from '@alphaTiles/data-language-assets';
import {
  GameShellContainer,
  useGameShell,
  type GameShellIcons,
} from '@alphaTiles/feature-game-shell';
import {
  standardizeWordSequence,
  type ScriptType,
} from '@shared/util-phoneme';
import { MalaysiaScreen, type MalaysiaRow } from './MalaysiaScreen';
import { paginate } from './paginate';
import { rowColor, PAGE_SIZE } from './rowColor';
import { wordsForStage } from './wordsForStage';
import type { MalaysiaData } from './malaysiaPreProcess';

type RouteParams = Record<string, string | string[] | GameShellIcons | undefined> & {
  icons?: GameShellIcons;
};

function MalaysiaGame(): React.JSX.Element {
  const assets = useLangAssets();
  const { speak } = useGameShell();
  const data = usePrecompute<MalaysiaData>('malaysia');
  const params = useLocalSearchParams<{ stage?: string }>();
  const { t } = useTranslation();

  const a11yLabels = useMemo(() => ({
    previousPage: t('chrome:a11y.previous_page'),
    nextPage: t('chrome:a11y.next_page'),
  }), [t]);
  const stage = parseInt(
    (Array.isArray(params.stage) ? params.stage[0] : params.stage) ?? '1',
    10,
  );

  const placeholderCharacter = assets.langInfo.find('Placeholder character') ?? '◌';
  const scriptType = (assets.langInfo.find('Script type') ?? 'Roman') as ScriptType;
  const colorList = assets.colors.hexByIndex;
  const isRTL = (assets.langInfo.find('scriptDirection') ?? 'LTR') === 'RTL';

  // Pages of up to PAGE_SIZE words for the active stage. Recomputed only when
  // stage or precomputed data changes (no in-game stage changes in Malaysia).
  const pages = useMemo(() => {
    const stageWords = wordsForStage(data.wordStagesByStage, stage);
    return paginate(stageWords, PAGE_SIZE);
  }, [data.wordStagesByStage, stage]);
  const pageCount = pages.length;

  const [page, setPage] = useState(0);
  // speak() starts playback synchronously (unrecorded words chain their
  // syllables under the shell lock), so rows never need a disabled window.
  const disabled = false;

  // Compute presenter rows for the current page (text via standardizeWordSequence,
  // background via the pyramid in colorList, image looked up by wordInLWC).
  const rows: MalaysiaRow[] = useMemo(() => {
    const slice = pages[page] ?? [];
    return slice.map((word, idx) => {
      const text = standardizeWordSequence(
        {
          wordInLOP: word.wordInLOP,
          mixedDefs: word.mixedDefs,
          tiles: assets.tiles.rows,
          scriptType,
          placeholderCharacter,
        },
        scriptType,
      );
      return {
        text,
        bgColor: rowColor(idx, colorList, data.colorless),
        image: assets.images.words[word.wordInLWC] as ImageSourcePropType | undefined,
        id: word.wordInLWC,
        a11yLabel: t('chrome:a11y.play_word', { word: text }),
      };
    });
  }, [
    pages,
    page,
    assets.tiles.rows,
    assets.images.words,
    scriptType,
    placeholderCharacter,
    colorList,
    data.colorless,
    t,
  ]);

  const onPress = useCallback(
    (rowIndex: number) => {
      // Image tap and text tap share this same handler — Malaysia.java:214-216
      // (`clickPicHearAudio` delegates to `onWordClick`).
      const word = pages[page]?.[rowIndex];
      if (word) speak({ word });
    },
    [speak, page, pages],
  );

  const onPrev = useCallback(() => {
    if (page <= 0) return;
    setPage((p) => Math.max(0, p - 1));
  }, [page]);

  const onNext = useCallback(() => {
    if (page >= pageCount - 1) return;
    setPage((p) => Math.min(pageCount - 1, p + 1));
  }, [page, pageCount]);

  const prevArrowSource = assets.images.icon as ImageSourcePropType | undefined;
  const nextArrowSource = assets.images.icon as ImageSourcePropType | undefined;

  return (
    <MalaysiaScreen
      rows={rows}
      page={page}
      pageCount={pageCount}
      disabled={disabled}
      prevArrowSource={prevArrowSource}
      nextArrowSource={nextArrowSource}
      rtl={isRTL}
      onPress={onPress}
      onPrev={onPrev}
      onNext={onNext}
      a11yLabels={a11yLabels}
    />
  );
}

export function MalaysiaContainer(props: RouteParams): React.JSX.Element {
  return (
    <GameShellContainer confirmOnBack={false} icons={props.icons}>
      <MalaysiaGame />
    </GameShellContainer>
  );
}
