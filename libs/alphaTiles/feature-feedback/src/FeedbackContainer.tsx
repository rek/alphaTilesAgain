/**
 * Feedback screen container (#41): opens the device mail app addressed to the
 * pack's contact email, subject prefilled with app, language, version and
 * platform. No server. If the mail app can't open, the address is shown to copy.
 *
 * Hidden while the pack email is absent or a placeholder (`contactEmailOf`):
 * direct navigation redirects to the menu.
 */
import React from 'react';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import {
  buildFeedbackSubject,
  buildMailtoUrl,
  contactEmailOf,
} from '@alphaTiles/util-contact';
import { useTranslation } from '@shared/util-i18n';
import { useTrackScreenMount } from '@shared/util-analytics';
import { FeedbackScreen } from './FeedbackScreen';

export function FeedbackContainer(): React.JSX.Element {
  const assets = useLangAssets();
  const { t } = useTranslation('chrome');
  const router = useRouter();
  const [mailFailed, setMailFailed] = React.useState(false);
  useTrackScreenMount('/feedback');

  const email = contactEmailOf({ email: assets.langInfo.find('Email') });
  if (email === undefined) {
    return <Redirect href="/menu" />;
  }

  const version =
    Constants.expoConfig?.version ?? Application.nativeApplicationVersion ?? '—';
  const subject = buildFeedbackSubject({
    appName: assets.langInfo.find('Game Name (In Local Lang)') ?? '',
    feedbackLabel: t('feedback.subject_label'),
    language: assets.langInfo.find('Lang Name (In English)') ?? '',
    version,
    platform: Platform.OS,
  });
  const url = buildMailtoUrl({ email, subject, body: t('feedback.mail_body') });

  const onSend = (): void => {
    Linking.openURL(url).then(
      () => { setMailFailed(false); },
      () => { setMailFailed(true); },
    );
  };

  return (
    <FeedbackScreen
      title={t('feedback.title')}
      backLabel={t('back')}
      onBack={() => { router.back(); }}
      intro={t('feedback.intro')}
      buttonLabel={t('feedback.button')}
      onSend={onSend}
      email={email}
      addressLabel={t('feedback.address_label')}
      mailFailed={mailFailed}
      noMailAppMessage={t('feedback.no_mail_app')}
    />
  );
}
