/**
 * Container for the Peru 4-choice word-recognition game.
 *
 * PeruContainer wraps GameShellContainer; PeruGame is the inner component
 * that calls useGameShell() and owns all game state.
 *
 * Port of Peru.java — see design.md for the full mapping table.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
  useShellAdvance,
} from '@alphaTiles/feature-game-shell';
import type { GameShellIcons } from '@alphaTiles/feature-game-shell';
import { buildTileHashMap } from '@shared/util-phoneme';
import type { ScriptType } from '@shared/util-phoneme';
import { PeruScreen } from './PeruScreen';
import type { PeruChoice } from './PeruScreen';
import { pickPeruWord } from './pickPeruWord';
import { buildAllChoices } from './buildAllChoices';
import type { ChoiceLevel } from './buildAllChoices';
import { buildSameTypePools } from './buildSameTypePools';

type RouteParams = Record<string, string | string[] | undefined> & {
  icons?: GameShellIcons;
};

const PALETTE_FALLBACK = ['#1565C0', '#43A047', '#E53935', '#FB8C00'];

function PeruGame({ challengeLevel }: { challengeLevel: ChoiceLevel }): React.JSX.Element {
  const shell = useGameShell();
  const {
    setRefWord, setInteractionLocked, incrementPointsAndTracker,
    replayWord, interactionLocked,
  } = shell;
  const audio = useAudio();
  const assets = useLangAssets();

  const scriptType = (assets.langInfo.find('Script type') ?? 'Roman') as ScriptType;
  const placeholderChar = assets.langInfo.find('Placeholder character') ?? '◌';
  const tileRows = assets.tiles.rows;
  const wordRows = assets.words.rows;

  const tileMap = useMemo(
    () => buildTileHashMap(tileRows, placeholderChar),
    [tileRows, placeholderChar],
  );
  // CL2 only — Java pre-shuffles VOWELS/CONSONANTS/TONES at onCreate when CL=2.
  const sameTypePools = useMemo(
    () => buildSameTypePools(tileRows),
    [tileRows],
  );

  const colorList = assets.colors.hexByIndex;

  const [choices, setChoices] = useState<PeruChoice[]>([]);
  const [correctText, setCorrectText] = useState<string>('');
  const [wordLabel, setWordLabel] = useState<string>('');
  const [wordImage, setWordImage] = useState<ImageSourcePropType | undefined>(undefined);
  const [error, setError] = useState<'insufficient-content' | null>(null);
  const wrongPicksRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);

  const startRound = useCallback(() => {
    setInteractionLocked(false);

    let pickedRound: {
      correct: string;
      choiceList: PeruChoice[];
      label: string;
      image: ImageSourcePropType | undefined;
      refWord: { wordInLOP: string; wordInLWC: string };
    } | null = null;

    for (let attempt = 0; attempt < 5 && pickedRound === null; attempt++) {
      const pick = pickPeruWord({
        words: wordRows,
        tiles: tileRows,
        scriptType,
        placeholderCharacter: placeholderChar,
      });
      if ('error' in pick) break;

      const built = buildAllChoices({
        level: challengeLevel,
        parsed: pick.parsed,
        tileMap,
        pools: sameTypePools,
        wordInLOP: pick.word.wordInLOP,
        mixedDefs: pick.word.mixedDefs,
        tiles: tileRows,
        scriptType,
        placeholderCharacter: placeholderChar,
      });
      if ('error' in built) continue;

      const palette = colorList.length >= 4 ? colorList : PALETTE_FALLBACK;
      const choiceList: PeruChoice[] = built.choices.map((text, i) => ({
        text,
        grayed: false,
        bgColor: palette[i % palette.length],
      }));

      pickedRound = {
        correct: built.correct,
        choiceList,
        label: pick.word.wordInLWC,
        image: assets.images.words[pick.word.wordInLWC] as ImageSourcePropType | undefined,
        refWord: { wordInLOP: pick.word.wordInLOP, wordInLWC: pick.word.wordInLWC },
      };
    }

    if (pickedRound === null) {
      setError('insufficient-content');
      return;
    }

    setError(null);
    setCorrectText(pickedRound.correct);
    setChoices(pickedRound.choiceList);
    setWordLabel(pickedRound.label);
    setWordImage(pickedRound.image);
    wrongPicksRef.current = [];
    setRefWord(pickedRound.refWord);
  }, [
    setRefWord, setInteractionLocked, assets.images.words, wordRows, tileRows,
    scriptType, placeholderChar, tileMap, sameTypePools, colorList, challengeLevel,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    startRound();
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useShellAdvance(startRound);

  const onChoicePress = useCallback(
    (index: number) => {
      if (interactionLocked) return;
      const choice = choices[index];
      if (!choice || choice.grayed) return;

      if (choice.text === correctText) {
        // Correct: gray non-correct, score, sequence audio (correct → word).
        const grayed = choices.map((c, i) =>
          i === index ? c : { ...c, grayed: true },
        );
        setChoices(grayed);
        setInteractionLocked(true);
        incrementPointsAndTracker(true);
        audio.playCorrect().then(() => {
          if (!isMountedRef.current) return;
          replayWord();
        });
      } else {
        // Wrong: track up to 3 distinct picks, play incorrect chime.
        const list = wrongPicksRef.current;
        if (!list.includes(choice.text) && list.length < 3) {
          list.push(choice.text);
        }
        audio.playIncorrect();
      }
    },
    [interactionLocked, setInteractionLocked, incrementPointsAndTracker, replayWord, audio, choices, correctText],
  );

  const onImagePress = useCallback(() => {
    replayWord();
  }, [replayWord]);

  if (error === 'insufficient-content') {
    return (
      <PeruScreen
        wordImage={undefined}
        wordLabel="?"
        choices={[]}
        interactionLocked
        onChoicePress={() => undefined}
        onImagePress={() => undefined}
      />
    );
  }

  if (choices.length === 0) return <></>;

  return (
    <PeruScreen
      wordImage={wordImage}
      wordLabel={wordLabel}
      choices={choices}
      interactionLocked={interactionLocked}
      onChoicePress={onChoicePress}
      onImagePress={onImagePress}
    />
  );
}

export function PeruContainer(props: RouteParams): React.JSX.Element {
  const assets = useLangAssets();
  const gameNumber = parseInt((props.gameNumber as string) ?? '1', 10);
  const rawLevel = parseInt((props.challengeLevel as string) ?? '1', 10);
  const challengeLevel = (rawLevel >= 1 && rawLevel <= 3 ? rawLevel : 1) as ChoiceLevel;
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
      <PeruGame challengeLevel={challengeLevel} />
    </GameShellContainer>
  );
}
