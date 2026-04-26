/**
 * Container for the Georgia first-sound-identification game.
 *
 * Wraps GameShellContainer; GeorgiaGame is the inner component that calls
 * useGameShell() and owns all game state.
 *
 * Port of Georgia.java (~455 LOC) — see design.md for the full mapping table
 * and the Java parity quirks (off-by-one in T-hard / fallback overwrite,
 * sequential indexing in S-random/S-hard fill, CorV filter being TILE-only).
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  useLangAssets,
  usePrecompute,
} from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
  useShellAdvance,
} from '@alphaTiles/feature-game-shell';
import type { GameShellIcons } from '@alphaTiles/feature-game-shell';
import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { ScriptType } from '@shared/util-phoneme';
import { GeorgiaScreen } from './GeorgiaScreen';
import type { GeorgiaChoice, GeorgiaGridShape } from './GeorgiaScreen';
import { countForLevel } from './countForLevel';
import { pickGeorgiaTileWord, pickGeorgiaSyllableWord } from './pickGeorgiaWord';
import { buildTileChoicesRandom } from './buildTileChoicesRandom';
import { buildTileChoicesHard } from './buildTileChoicesHard';
import { buildSyllableChoicesRandom } from './buildSyllableChoicesRandom';
import { buildSyllableChoicesHard } from './buildSyllableChoicesHard';
import { parseWordIntoSyllables } from './parseWordIntoSyllables';
import { shuffleArray } from './shuffleArray';
import { stripInstructionCharacters } from './stripInstructionCharacters';
import type { GeorgiaData } from './georgiaPreProcess';

type WordRow = LangAssets['words']['rows'][number];
type TileRow = LangAssets['tiles']['rows'][number];
type SyllableRow = LangAssets['syllables']['rows'][number];

type RouteParams = Record<string, string | string[] | undefined> & {
  icons?: GameShellIcons;
};

const PALETTE_FALLBACK = [
  '#1565C0',
  '#43A047',
  '#E53935',
  '#FB8C00',
  '#8E24AA',
];

function isHardBand(level: number): boolean {
  // Hard bands: 4–6 (T-CL4-6) and 10–12 (T-CL10-12). For S, hard band is 4–6.
  return (level >= 4 && level <= 6) || (level >= 10 && level <= 12);
}

function findTileRow(
  tiles: TileRow[],
  base: string,
): TileRow | undefined {
  return tiles.find((t) => t.base === base);
}

type Round = {
  word: WordRow;
  correctText: string;
  choices: GeorgiaChoice[];
  visibleGameButtons: GeorgiaGridShape;
  revealedText: string;
};

function GeorgiaGame({
  challengeLevel,
  syllableGame,
}: {
  challengeLevel: number;
  syllableGame: string;
}): React.JSX.Element {
  const shell = useGameShell();
  const audio = useAudio();
  const assets = useLangAssets();
  const data = usePrecompute<GeorgiaData>('georgia');

  const scriptType = (assets.langInfo.find('Script type') ??
    'Roman') as ScriptType;
  const placeholderChar = assets.langInfo.find('Placeholder character') ?? '◌';
  const tileRows = assets.tiles.rows;
  const wordRows = assets.words.rows;
  const syllableRows = assets.syllables.rows;
  const colorList =
    assets.colors.hexByIndex.length > 0
      ? assets.colors.hexByIndex
      : PALETTE_FALLBACK;

  const isSyllable = syllableGame === 'S';
  const visibleGameButtons = countForLevel(challengeLevel) as GeorgiaGridShape;

  // syllableListCopy — Java ~129 (clone + shuffle once at mount); ~153
  // (re-shuffled at each playAgain). We keep a mutable ref and shuffle on
  // each round start.
  const syllablePoolRef = useRef<SyllableRow[]>([]);
  const isMountedRef = useRef(true);

  const corVTexts = useMemo(
    () => new Set(data.corV.map((t) => t.base)),
    [data.corV],
  );

  const [round, setRound] = useState<Round | null>(null);
  const [error, setError] = useState<'insufficient-content' | null>(null);
  const wrongPicksRef = useRef<string[]>([]);

  const decorate = useCallback(
    (texts: string[]): GeorgiaChoice[] =>
      texts.map((text, i) => ({
        text,
        grayed: false,
        bgColor: colorList[i % colorList.length] ?? PALETTE_FALLBACK[i % 5],
      })),
    [colorList],
  );

  const startRound = useCallback(() => {
    shell.setInteractionLocked(false);
    wrongPicksRef.current = [];

    if (isSyllable) {
      // Re-shuffle syllable pool — Java ~153.
      if (syllablePoolRef.current.length === 0) {
        syllablePoolRef.current = [...syllableRows];
      }
      shuffleArray(syllablePoolRef.current, Math.random);

      // Pick a word; parse syllables; correct = parsed[0].
      let attempts = 0;
      let chosen: { word: WordRow; correctSyllable: SyllableRow } | null = null;
      while (attempts < 50 && chosen === null) {
        const pick = pickGeorgiaSyllableWord({
          words: wordRows,
          rng: Math.random,
        });
        if ('error' in pick) break;
        const parsed = parseWordIntoSyllables(pick.word.wordInLOP, syllableRows);
        if (parsed.length > 0) {
          chosen = { word: pick.word, correctSyllable: parsed[0] };
        }
        attempts++;
      }
      if (!chosen) {
        setError('insufficient-content');
        return;
      }

      const correctText = chosen.correctSyllable.syllable;
      const distractors = chosen.correctSyllable.distractors;

      const texts = isHardBand(challengeLevel)
        ? buildSyllableChoicesHard({
            visibleGameButtons,
            syllablePool: syllablePoolRef.current,
            correctText,
            distractors,
          })
        : buildSyllableChoicesRandom({
            visibleGameButtons,
            syllablePool: syllablePoolRef.current,
            correctText,
            rng: Math.random,
          });

      // Hard branch: shuffle visible-slot order so correct isn't always idx 0.
      const display = isHardBand(challengeLevel)
        ? shuffleArray([...texts], Math.random)
        : texts;

      const choices = decorate(display.slice(0, visibleGameButtons));
      while (choices.length < visibleGameButtons) {
        choices.push({
          text: '',
          grayed: false,
          bgColor: colorList[choices.length % colorList.length] ?? '#999',
        });
      }

      setError(null);
      setRound({
        word: chosen.word,
        correctText,
        choices,
        visibleGameButtons,
        revealedText: '',
      });
      shell.setRefWord({
        wordInLOP: chosen.word.wordInLOP,
        wordInLWC: chosen.word.wordInLWC,
      });
      // Java line 161: playActiveWordClip(false).
      audio.playWord(chosen.word.wordInLWC);
      return;
    }

    // Tile variant.
    const pick = pickGeorgiaTileWord({
      level: challengeLevel,
      words: wordRows,
      tiles: tileRows,
      corVTexts,
      scriptType,
      placeholderCharacter: placeholderChar,
      rng: Math.random,
    });
    if ('error' in pick) {
      setError('insufficient-content');
      return;
    }

    const correctText = pick.correct.base;
    const tileRow = findTileRow(tileRows, correctText);
    const distractors: [string, string, string] = [
      tileRow?.alt1 ?? '',
      tileRow?.alt2 ?? '',
      tileRow?.alt3 ?? '',
    ];

    const texts = isHardBand(challengeLevel)
      ? buildTileChoicesHard({
          visibleGameButtons,
          corV: data.corV,
          correctText,
          distractors,
          rng: Math.random,
        })
      : buildTileChoicesRandom({
          visibleGameButtons,
          corV: data.corV,
          correctText,
          rng: Math.random,
        });

    const display = isHardBand(challengeLevel)
      ? shuffleArray([...texts], Math.random)
      : texts;

    const choices = decorate(display.slice(0, visibleGameButtons));
    while (choices.length < visibleGameButtons) {
      choices.push({
        text: '',
        grayed: false,
        bgColor: colorList[choices.length % colorList.length] ?? '#999',
      });
    }

    setError(null);
    setRound({
      word: pick.word,
      correctText,
      choices,
      visibleGameButtons,
      revealedText: '',
    });
    shell.setRefWord({
      wordInLOP: pick.word.wordInLOP,
      wordInLWC: pick.word.wordInLWC,
    });
    // Java line 161: playActiveWordClip(false).
    audio.playWord(pick.word.wordInLWC);
  }, [
    shell,
    audio,
    isSyllable,
    challengeLevel,
    visibleGameButtons,
    wordRows,
    tileRows,
    syllableRows,
    scriptType,
    placeholderChar,
    corVTexts,
    data.corV,
    colorList,
    decorate,
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
      if (!round) return;
      if (shell.interactionLocked) return;
      const choice = round.choices[index];
      if (!choice || choice.grayed || choice.text === '') return;

      if (choice.text === round.correctText) {
        const grayed = round.choices.map((c, i) =>
          i === index ? c : { ...c, grayed: true },
        );
        const revealed = stripInstructionCharacters(round.word.wordInLOP);
        setRound({ ...round, choices: grayed, revealedText: revealed });
        shell.setInteractionLocked(true);
        // Java updatePointsAndTrackers(2) → TS incrementPointsAndTracker(true).
        shell.incrementPointsAndTracker(true);
        // Java playCorrectSoundThenActiveWordClip(false) (~432).
        audio.playCorrect().then(() => {
          if (!isMountedRef.current) return;
          shell.replayWord();
        });
      } else {
        // Track up to visibleGameButtons - 1 distinct wrong picks.
        const list = wrongPicksRef.current;
        if (
          !list.includes(choice.text) &&
          list.length < round.visibleGameButtons - 1
        ) {
          list.push(choice.text);
        }
        audio.playIncorrect();
      }
    },
    [round, shell, audio],
  );

  const onImagePress = useCallback(() => {
    shell.replayWord();
  }, [shell]);

  if (error === 'insufficient-content') {
    return (
      <GeorgiaScreen
        wordImage={undefined}
        wordLabel="?"
        revealedText=""
        choices={[]}
        gridShape={visibleGameButtons}
        interactionLocked
        onChoicePress={() => undefined}
        onImagePress={() => undefined}
      />
    );
  }

  if (!round) return <></>;

  const wordImage = assets.images.words[round.word.wordInLWC] as
    | ImageSourcePropType
    | undefined;

  return (
    <GeorgiaScreen
      wordImage={wordImage}
      wordLabel={round.word.wordInLWC}
      revealedText={round.revealedText}
      choices={round.choices}
      gridShape={round.visibleGameButtons}
      interactionLocked={shell.interactionLocked}
      onChoicePress={onChoicePress}
      onImagePress={onImagePress}
    />
  );
}

export function GeorgiaContainer(props: RouteParams): React.JSX.Element {
  const assets = useLangAssets();
  const gameNumber = parseInt((props.gameNumber as string) ?? '1', 10);
  const challengeLevel = parseInt((props.challengeLevel as string) ?? '1', 10);
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
      icons={props.icons}
    >
      <GeorgiaGame
        challengeLevel={challengeLevel}
        syllableGame={syllableGame}
      />
    </GameShellContainer>
  );
}
