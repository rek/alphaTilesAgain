import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { useRouter } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useActivePlayer, usePlayersStore } from '@alphaTiles/data-players';
import { useTotalPoints } from '@alphaTiles/data-progress';
import { useAudio } from '@alphaTiles/data-audio';
import { track } from '@shared/util-analytics';
import { useDoors } from './useDoors';
import { GameMenuScreen } from './GameMenuScreen';

export function GameMenuContainer(): React.JSX.Element {
  const player = useActivePlayer();
  const router = useRouter();
  const { t } = useTranslation('chrome');
  const assets = useLangAssets();
  const { playInstruction } = useAudio();
  const [page, setPage] = useState(0);

  const { pageDoors, totalPages } = useDoors(player?.id ?? null, page);
  const score = useTotalPoints(player?.id ?? '');

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
    const door = pageDoors.find((d) => d.index === doorIndex);
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

  return (
    <GameMenuScreen
      doors={pageDoors}
      page={page}
      totalPages={totalPages}
      playerName={player.name}
      playerAvatarSrc={playerAvatarSrc}
      score={score}
      showShare={hasShare}
      showResources={hasResources}
      showAbout={true}
      showAudioInstructions={hasEarthInstructions}
      onDoorPress={onDoorPress}
      onPrev={onPrev}
      onNext={onNext}
      onBack={onBack}
      onAbout={onAbout}
      onShare={onShare}
      onResources={onResources}
      onAudioInstructions={onAudioInstructions}
      a11y={{
        prev: t('menu.a11y.prev'),
        next: t('menu.a11y.next'),
        back: t('menu.a11y.back_to_players'),
        about: t('menu.a11y.about'),
        share: t('menu.a11y.share'),
        resources: t('menu.a11y.resources'),
        audioInstructions: t('menu.a11y.audio_instructions'),
        score: t('menu.score', { points: score }),
      }}
    />
  );
}
