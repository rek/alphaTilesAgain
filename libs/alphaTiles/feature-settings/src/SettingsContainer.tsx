/**
 * Settings screen container (#44): the active player's preferences.
 * Reads values through the effective-settings lookup and writes through the
 * active player's preference setter — never the stores directly.
 */
import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { contactEmailOf } from '@alphaTiles/util-contact';
import { useActivePlayer } from '@alphaTiles/data-players';
import { useEffectiveSettings, useSetPreference } from '@alphaTiles/data-settings';
import { useTranslation } from '@shared/util-i18n';
import { useTrackScreenMount } from '@shared/util-analytics';
import { SettingsScreen } from './SettingsScreen';

export function SettingsContainer(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('chrome');
  const player = useActivePlayer();
  const settings = useEffectiveSettings();
  const setPreference = useSetPreference();
  const assets = useLangAssets();
  useTrackScreenMount('/settings');

  // Feedback is mailto the pack contact: hidden while that is absent/placeholder.
  const showFeedback = contactEmailOf({ email: assets.langInfo.find('Email') }) !== undefined;

  if (player === null) {
    return <Redirect href="/choose-player" />;
  }

  return (
    <SettingsScreen
      title={t('settings.title')}
      backLabel={t('back')}
      onBack={() => { router.back(); }}
      showGameNames={settings.showGameNames}
      showGameNamesLabel={t('settings.show_game_names')}
      showGameNamesHint={t('settings.show_game_names_hint')}
      onShowGameNamesChange={(value) => { setPreference({ showGameNames: value }); }}
      showFeedback={showFeedback}
      feedbackLabel={t('settings.feedback')}
      feedbackHint={t('settings.feedback_hint')}
      onFeedback={() => { router.push('/feedback'); }}
    />
  );
}
