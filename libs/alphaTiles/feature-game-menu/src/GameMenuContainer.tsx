import React, { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useActivePlayer, usePlayersStore } from '@alphaTiles/data-players';
import { useEffectiveSettings } from '@alphaTiles/data-settings';
import { useTotalPoints } from '@alphaTiles/data-progress';
import { usePackSpeech } from '@alphaTiles/data-audio';
import { useDoors } from '@alphaTiles/data-doors';
import { SELF_TEST_LENGTH, selfTestSources } from '@alphaTiles/feature-self-test';
import { track } from '@shared/util-analytics';
import { doorHref } from './doorHref';
import { useMenuDoors } from './useMenuDoors';
// import { GameMenuScreen } from './GameMenuScreen'; // classic layout — disabled
import { GameMenuScreenModern } from './GameMenuScreenModern';

export function GameMenuContainer(): React.JSX.Element {
  const player = useActivePlayer();
  const router = useRouter();
  const { t } = useTranslation('chrome');
  const assets = useLangAssets();
  const { speak } = usePackSpeech({ words: assets.words.rows, syllables: assets.syllables.rows });

  const [guidanceOpen, setGuidanceOpen] = useState(false);
  // First menu visit per player: the "where to start" sheet opens by itself
  // once; closing it records it as seen (U8).
  const guidanceVisible = guidanceOpen || (player !== null && !player.seenPlacementGuidance);
  function closeGuidance(): void {
    setGuidanceOpen(false);
    if (player !== null && !player.seenPlacementGuidance) {
      usePlayersStore.getState().markPlacementGuidanceSeen(player.id);
    }
  }
  const menuDoors = useMenuDoors(player?.id ?? null);
  const { showGameNames } = useEffectiveSettings();
  // Ladder order (tier, then file order); "Level N" badge per door. Names off
  // (settings toggle) → every door unlabelled, as before #37.
  const allDoors = menuDoors.map((door) => ({
    ...door,
    name: showGameNames ? door.name : undefined,
    levelLabel: t('menu.level', { n: door.tier }),
  }));
  const score = useTotalPoints(player?.id ?? '');
  // Self-test (#42): offered below the grid when the pack has question doors.
  const hasSelfTest = selfTestSources(useDoors()).length > 0;

  if (player === null) {
    return <Redirect href="/choose-player" />;
  }

  const hasShare = assets.share.trim().length > 0;
  const hasResources = assets.resources.rows.length > 0;
  const hasEarthInstructions = 'zzz_earth' in assets.audio.instructions;

  const avatarSrc = assets.images.avatars[player.avatarIndex] ?? null;
  const playerAvatarSrc = avatarSrc !== null && avatarSrc !== undefined
    ? (avatarSrc as number)
    : null;

  function onDoorPress(doorIndex: number): void {
    const door = allDoors.find((d) => d.index === doorIndex);
    if (!door) return;
    track('screen_viewed', { screenName: `game/${door.classKey}` });
    router.push(doorHref(door));
  }

  function onBack(): void {
    usePlayersStore.getState().clearActivePlayer();
    router.replace('/choose-player');
  }

  function onAbout(): void {
    router.push('/about');
  }

  function onShare(): void {
    router.push('/share');
  }

  function onResources(): void {
    router.push('/resources');
  }

  function onSettings(): void {
    router.push('/settings');
  }

  function onAudioInstructions(): void {
    speak({ instruction: 'zzz_earth' });
  }

  const doorStates = {
    'not-started': t('menu.a11y.door_state.not_started'),
    'in-process': t('menu.a11y.door_state.in_process'),
    mastery: t('menu.a11y.door_state.mastery'),
  };
  // No-right/wrong doors (Malaysia, Sudan, Iraq…) are drawn filled (Java
  // parity) but are not "in progress" — announce them as free exploration (U10).
  const freeExplore = t('menu.a11y.door_state.free_explore');

  // Guidance sheet lists only the step bands this pack has doors in (U10).
  const tiers = allDoors.map((d) => d.tier);
  const minTier = tiers.length > 0 ? Math.min(...tiers) : 0;
  const maxTier = tiers.length > 0 ? Math.max(...tiers) : 0;
  const hasTierIn = (lo: number, hi: number) => tiers.some((n) => n >= lo && n <= hi);
  const bands = [
    { lo: 0, hi: 1, title: t('placementGuidance.band_0_1_title'), body: t('placementGuidance.band_0_1') },
    { lo: 2, hi: 3, title: t('placementGuidance.band_2_3_title'), body: t('placementGuidance.band_2_3') },
    { lo: 4, hi: 6, title: t('placementGuidance.band_4_6_title'), body: t('placementGuidance.band_4_6') },
  ]
    .filter((b) => hasTierIn(b.lo, b.hi))
    .map(({ title, body }) => ({ title, body }));

  const commonProps = {
    playerName: player.name,
    playerAvatarSrc,
    score,
    showShare: hasShare,
    showResources: hasResources,
    showAbout: true,
    showAudioInstructions: hasEarthInstructions,
    onDoorPress,
    onBack,
    onAbout,
    onShare,
    onResources,
    onAudioInstructions,
    onSettings,
    guidance: {
      visible: guidanceVisible,
      onOpen: () => setGuidanceOpen(true),
      onClose: closeGuidance,
      strings: {
        title: t('placementGuidance.title'),
        intro: t('placementGuidance.intro', { min: minTier, max: maxTier }),
        bands,
        tip: t('placementGuidance.tip'),
        close: t('placementGuidance.close'),
      },
    },
    a11y: {
      back: t('menu.a11y.back_to_players'),
      about: t('menu.a11y.about'),
      share: t('menu.a11y.share'),
      resources: t('menu.a11y.resources'),
      audioInstructions: t('menu.a11y.audio_instructions'),
      settings: t('menu.a11y.settings'),
      score: t('menu.score', { points: score }),
      howLevelsWork: t('menu.a11y.how_levels_work'),
    },
    tabLabels: {
      about: t('menu.tabs.about'),
      share: t('menu.tabs.share'),
      resources: t('menu.tabs.resources'),
      audioInstructions: t('menu.tabs.audio'),
      settings: t('menu.tabs.settings'),
    },
    doorLabel: (door: {
      index: number;
      name?: string;
      visual: keyof typeof doorStates;
      tracksProgress: boolean;
      levelLabel?: string;
    }) => {
      const state = door.tracksProgress ? doorStates[door.visual] : freeExplore;
      const label = door.name
        ? t('menu.a11y.door_named', { index: door.index, name: door.name, state })
        : t('menu.a11y.door', { index: door.index, state });
      return door.levelLabel ? t('menu.a11y.door_with_level', { door: label, level: door.levelLabel }) : label;
    },
  };

  const selfTest = hasSelfTest
    ? {
        label: t('menu.self_test'),
        a11yLabel: t('menu.a11y.self_test', { n: SELF_TEST_LENGTH }),
        onPress: () => router.push('/self-test'),
      }
    : undefined;

  return <GameMenuScreenModern {...commonProps} allDoors={allDoors} selfTest={selfTest} />;
}
