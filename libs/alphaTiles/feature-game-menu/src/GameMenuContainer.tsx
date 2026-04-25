import React, { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useTranslation } from '@shared/util-i18n';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useActivePlayer, usePlayersStore } from '@alphaTiles/data-players';
import { useTotalPoints } from '@alphaTiles/data-progress';
import { useAudio } from '@alphaTiles/data-audio';
import { track } from '@shared/util-analytics';
import { useDoors } from './useDoors';
import type { DoorItem } from '@shared/ui-door-grid';
import { GameMenuScreen } from './GameMenuScreen';
import { GameMenuScreenModern } from './GameMenuScreenModern';

const DOOR_ASPECT = 88 / 64;

export function GameMenuContainer(): React.JSX.Element {
  const player = useActivePlayer();
  const router = useRouter();
  const { t } = useTranslation('chrome');
  const assets = useLangAssets();
  const { playInstruction } = useAudio();
  const [page, setPage] = useState(0);
  const [layout, setLayout] = useState<'classic' | 'modern'>('classic');
  const { width } = useWindowDimensions();

  const { pageDoors, allDoors, totalPages } = useDoors(player?.id ?? null, page);
  const score = useTotalPoints(player?.id ?? '');
  const tMenu = (key: string, opts?: Record<string, unknown>) => t(`menu.${key}`, opts);

  // Scale doors up on wider screens; mobile keeps default 64px
  const doorWidth = Math.min(120, Math.max(64, Math.floor(width / 8)));
  const doorHeight = Math.round(doorWidth * DOOR_ASPECT);

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

  const classicDoors: DoorItem[] = pageDoors.map((door) => ({
    index: door.index,
    colorHex: door.colorHex,
    visual: door.visual,
    textColorHex: door.textColorHex,
    a11yLabel: tMenu('a11y.door', { index: door.index, state: door.visual }),
  }));

  function onDoorPress(doorIndex: number): void {
    const door = allDoors.find((d) => d.index === doorIndex);
    if (!door) return;
    track({
      type: 'screen_viewed',
      props: { screenName: `game/${door.classKey}` },
    });
    router.push({
      pathname: '/games/[classKey]',
      params: {
        classKey: door.classKey,
        doorIndex: String(door.index),
        challengeLevel: String(door.challengeLevel),
      },
    });
  }

  function onBack(): void {
    usePlayersStore.getState().clearActivePlayer();
    router.replace('/choose-player');
  }

  function onPrev(): void {
    setPage((p) => Math.max(0, p - 1));
  }

  function onNext(): void {
    setPage((p) => Math.min(totalPages - 1, p + 1));
  }

  function onToggleLayout(): void {
    setLayout((l) => l === 'classic' ? 'modern' : 'classic');
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

  function onAudioInstructions(): void {
    playInstruction('zzz_earth');
  }

  const commonProps = {
    playerName: player.name,
    playerAvatarSrc,
    score,
    showShare: hasShare,
    showResources: hasResources,
    showAbout: true,
    showAudioInstructions: hasEarthInstructions,
    layout,
    onDoorPress,
    onBack,
    onAbout,
    onShare,
    onResources,
    onAudioInstructions,
    onToggleLayout,
    a11y: {
      back: t('menu.a11y.back_to_players'),
      about: t('menu.a11y.about'),
      share: t('menu.a11y.share'),
      resources: t('menu.a11y.resources'),
      audioInstructions: t('menu.a11y.audio_instructions'),
      score: t('menu.score', { points: score }),
      toggleLayout: t('menu.a11y.toggle_layout'),
    },
  };

  if (layout === 'modern') {
    return <GameMenuScreenModern {...commonProps} allDoors={allDoors} />;
  }

  return (
    <GameMenuScreen
      {...commonProps}
      doors={classicDoors}
      page={page}
      totalPages={totalPages}
      doorWidth={doorWidth}
      doorHeight={doorHeight}
      onPrev={onPrev}
      onNext={onNext}
      a11y={{
        ...commonProps.a11y,
        prev: t('menu.a11y.prev'),
        next: t('menu.a11y.next'),
      }}
    />
  );
}
