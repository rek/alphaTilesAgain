/**
 * Container for the Ecuador 8-tile scatter word-match game.
 *
 * EcuadorContainer wraps GameShellContainer; EcuadorGame is the inner component
 * that calls useGameShell() and owns all state.
 *
 * Port of Ecuador.java — see design.md for the full mapping table.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
  useShellAdvance,
} from '@alphaTiles/feature-game-shell';
import type { GameShellIcons } from '@alphaTiles/feature-game-shell';
import { EcuadorScreen } from './EcuadorScreen';
import type { EcuadorTile } from './EcuadorScreen';
import { pickEcuadorWords } from './pickEcuadorWords';
import { placeTiles } from './placeTiles';
import { tileColor } from './tileColor';

type RouteParams = Record<string, string | string[] | undefined> & {
  icons?: GameShellIcons;
};

const TILE_COUNT = 8;
const WRONG_PICKS_CAP = TILE_COUNT - 1; // Java visibleGameButtons - 1

function EcuadorGame(): React.JSX.Element {
  const shell = useGameShell();
  const {
    setRefWord, setInteractionLocked, incrementPointsAndTracker,
    replayWord, interactionLocked,
  } = shell;
  const audio = useAudio();
  const assets = useLangAssets();
  const { width, height } = useWindowDimensions();

  const wordRows = assets.words.rows;
  const colorPalette = assets.colors.hexByIndex;

  const [tiles, setTiles] = useState<EcuadorTile[]>([]);
  const [correctText, setCorrectText] = useState<string>('');
  const [promptLabel, setPromptLabel] = useState<string>('');
  const [promptImage, setPromptImage] = useState<ImageSourcePropType | undefined>(
    undefined,
  );
  const [error, setError] = useState<'insufficient-content' | null>(null);
  const wrongPicksRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);

  const area = useMemo(() => ({ width, height }), [width, height]);

  const startRound = useCallback(() => {
    setInteractionLocked(false);

    let placement: ReturnType<typeof placeTiles> = null;
    let pick: ReturnType<typeof pickEcuadorWords> | null = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = pickEcuadorWords({ words: wordRows });
      if ('error' in candidate) {
        pick = candidate;
        break;
      }
      const placed = placeTiles({ area });
      if (placed !== null) {
        pick = candidate;
        placement = placed;
        break;
      }
      pick = candidate;
    }

    if (pick === null || 'error' in pick || placement === null) {
      setError('insufficient-content');
      return;
    }

    const promptText = pick.prompt.wordInLOP;
    const tileTexts: string[] = pick.tileWords.map((w) => w.wordInLOP);
    // Java parity: OVERWRITE the random slot with prompt's stripped LOP.
    tileTexts[pick.correctSlot] = promptText;

    const built: EcuadorTile[] = placement.map((p, i) => ({
      text: tileTexts[i],
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      bgColor: tileColor(i, colorPalette),
      grayed: false,
    }));

    setError(null);
    setTiles(built);
    setCorrectText(promptText);
    setPromptLabel(promptText);
    setPromptImage(
      assets.images.wordsAlt[pick.prompt.wordInLWC] as ImageSourcePropType | undefined,
    );
    wrongPicksRef.current = [];
    setRefWord({
      wordInLOP: pick.prompt.wordInLOP,
      wordInLWC: pick.prompt.wordInLWC,
    });
  }, [setRefWord, setInteractionLocked, wordRows, area, colorPalette, assets.images.wordsAlt]);

  useEffect(() => {
    isMountedRef.current = true;
    startRound();
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useShellAdvance(startRound);

  const onTilePress = useCallback(
    (slot: number) => {
      if (interactionLocked) return;
      const tile = tiles[slot];
      if (!tile || tile.grayed) return;

      if (tile.text === correctText) {
        const grayed = tiles.map((t, i) =>
          i === slot ? t : { ...t, grayed: true },
        );
        setTiles(grayed);
        setInteractionLocked(true);
        // Java updatePointsAndTrackers(2) → 2 points per correct.
        incrementPointsAndTracker(true, 2);
        audio.playCorrect().then(() => {
          if (!isMountedRef.current) return;
          replayWord();
        });
      } else {
        const list = wrongPicksRef.current;
        if (!list.includes(tile.text) && list.length < WRONG_PICKS_CAP) {
          list.push(tile.text);
        }
        audio.playIncorrect();
      }
    },
    [interactionLocked, setInteractionLocked, incrementPointsAndTracker, replayWord, audio, tiles, correctText],
  );

  const onImagePress = useCallback(() => {
    replayWord();
  }, [replayWord]);

  if (error === 'insufficient-content') {
    return (
      <EcuadorScreen
        promptImage={undefined}
        promptLabel="?"
        tiles={[]}
        interactionLocked
        onTilePress={() => undefined}
        onImagePress={() => undefined}
      />
    );
  }

  if (tiles.length === 0) return <></>;

  return (
    <EcuadorScreen
      promptImage={promptImage}
      promptLabel={promptLabel}
      tiles={tiles}
      interactionLocked={interactionLocked}
      onTilePress={onTilePress}
      onImagePress={onImagePress}
    />
  );
}

export function EcuadorContainer(props: RouteParams): React.JSX.Element {
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
      <EcuadorGame />
    </GameShellContainer>
  );
}
