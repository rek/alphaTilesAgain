/**
 * Container for the Malaysia non-scored word browser.
 *
 * Outer:  <MalaysiaContainer> wraps <GameShellContainer> (chrome + i18n).
 * Inner:  <MalaysiaGame> consumes useGameShell() / useLangAssets() / useAudio()
 *         and owns the page state. NO_TRACKER guard: this container MUST NOT
 *         call shell.incrementPointsAndTracker (Malaysia is in
 *         NO_TRACKER_COUNTRIES; spec ADDED Requirement: NO_TRACKER Guard).
 *
 * Port of Malaysia.java — see openspec/changes/game-malaysia/design.md for the
 * full mapping table.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  useLangAssets,
  usePrecompute,
} from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
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

type RouteParams = Record<string, string | string[] | undefined> & {
  icons?: GameShellIcons;
};

function MalaysiaGame(): React.JSX.Element {
  const assets = useLangAssets();
  const audio = useAudio();
  const data = usePrecompute<MalaysiaData>('malaysia');
  const params = useLocalSearchParams<{ stage?: string }>();
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
  const [disabled, setDisabled] = useState(false);

  // Track the latest play to ignore re-enables from a stale audio promise after
  // a page change (Malaysia spec: "Page change cancels pending audio").
  const playTokenRef = useRef(0);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
  ]);

  const onPress = useCallback(
    (rowIndex: number) => {
      if (disabled) return;
      const word = pages[page]?.[rowIndex];
      if (!word) return;
      const myToken = ++playTokenRef.current;
      setDisabled(true);
      // Image tap and text tap share this same handler — Malaysia.java:214-216
      // (`clickPicHearAudio` delegates to `onWordClick`).
      audio
        .playWord(word.wordInLWC)
        .catch(() => {
          // Swallow audio errors; we still want to re-enable below.
        })
        .finally(() => {
          if (!isMountedRef.current) return;
          // Stale token (page changed mid-play) — leave disabled state to the
          // page-change handler, which already reset it.
          if (playTokenRef.current !== myToken) return;
          setDisabled(false);
        });
    },
    [audio, disabled, page, pages],
  );

  const cancelInFlight = useCallback(() => {
    // Bumping the token invalidates any pending re-enable from `playWord`.
    playTokenRef.current++;
    setDisabled(false);
  }, []);

  const onPrev = useCallback(() => {
    if (page <= 0) return;
    cancelInFlight();
    setPage((p) => Math.max(0, p - 1));
  }, [page, cancelInFlight]);

  const onNext = useCallback(() => {
    if (page >= pageCount - 1) return;
    cancelInFlight();
    setPage((p) => Math.min(pageCount - 1, p + 1));
  }, [page, pageCount, cancelInFlight]);

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
    />
  );
}

export function MalaysiaContainer(props: RouteParams): React.JSX.Element {
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
      icons={props.icons}
    >
      <MalaysiaGame />
    </GameShellContainer>
  );
}
