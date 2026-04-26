import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useActivePlayer, usePlayersStore } from '@alphaTiles/data-players';
import { useTotalPoints } from '@alphaTiles/data-progress';
import { useAudio } from '@alphaTiles/data-audio';
import { track } from '@shared/util-analytics';
import { useDoors } from './useDoors';
// import { GameMenuScreen } from './GameMenuScreen'; // classic layout — disabled
import { GameMenuScreenModern } from './GameMenuScreenModern';

export function GameMenuContainer(): React.JSX.Element {
  const player = useActivePlayer();
  const router = useRouter();
  const { t } = useTranslation('chrome');
  const assets = useLangAssets();
  const { playInstruction } = useAudio();

  const { allDoors } = useDoors(player?.id ?? null, 0);
  const score = useTotalPoints(player?.id ?? '');
  const tMenu = (key: string, opts?: Record<string, unknown>) => t(`menu.${key}`, opts);

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
    onDoorPress,
    onBack,
    onAbout,
    onShare,
    onResources,
    onAudioInstructions,
    a11y: {
      back: t('menu.a11y.back_to_players'),
      about: t('menu.a11y.about'),
      share: t('menu.a11y.share'),
      resources: t('menu.a11y.resources'),
      audioInstructions: t('menu.a11y.audio_instructions'),
      score: t('menu.score', { points: score }),
    },
  };

  return <GameMenuScreenModern {...commonProps} allDoors={allDoors} />;
}
