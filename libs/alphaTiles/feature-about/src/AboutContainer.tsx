/**
 * Container for the About screen.
 *
 * Owns hooks, i18n, analytics, and side-effect callbacks.
 * Passes pre-translated strings + handlers to AboutScreen (pure presenter).
 *
 * Design decisions: D8 (container/presenter split), D9 (analytics), D11 (a11y).
 * Fallback matrix: D7.
 */

import React from 'react';
import * as Application from 'expo-application';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useTranslation } from '@shared/util-i18n';
import { useTrackScreenMount } from '@shared/util-analytics';
import { AboutScreen } from './AboutScreen';

function isAbsent(value: string | undefined): boolean {
  return value === undefined || value === '' || value.toLowerCase() === 'none';
}

export function AboutContainer(): React.JSX.Element {
  const assets = useLangAssets();
  const { t } = useTranslation();
  useTrackScreenMount('/about');

  const langInfo = assets.langInfo;

  // aa_langinfo items (0-based index after stripping header)
  const localLangName = langInfo.find('Lang Name (In Local Lang)') ?? '';
  const englishName = langInfo.find('Lang Name (In English)') ?? '';
  const country = langInfo.find('Country') ?? '';
  const creditsText = langInfo.find('Audio and image credits') ?? '';
  const secondaryCreditsText = langInfo.find('Audio and image credits (lang 2)') ?? '';
  const email = langInfo.find('Email');
  const privacyUrl = langInfo.find('Privacy Policy');

  // Visibility flags per design.md §D7
  const showEmail = !isAbsent(email);
  const showPrivacy = !isAbsent(privacyUrl);
  const showSecondaryCredits = !isAbsent(secondaryCreditsText);

  // Mirroring Java About.java names_plus_countryA vs B:
  // If local name == English name, format with just one name.
  const sameNames = localLangName === englishName;
  const langPlusCountry = sameNames
    ? `${localLangName} (${country})`
    : `${localLangName} / ${englishName} (${country})`;

  const version = Application.nativeApplicationVersion ?? '—';
  const versionLabel = t('chrome:about.version', { version });

  const onPrivacyTap = (): void => {
    if (privacyUrl) {
      void WebBrowser.openBrowserAsync(privacyUrl);
    }
  };

  const onEmailTap = (): void => {
    if (email) {
      void Linking.openURL(`mailto:${email}`);
    }
  };

  return (
    <AboutScreen
      versionLabel={versionLabel}
      localName={localLangName}
      langPlusCountry={langPlusCountry}
      creditsHeading={t('chrome:about.credits')}
      credits={creditsText}
      showSecondaryCredits={showSecondaryCredits}
      secondaryCredits={secondaryCreditsText}
      showEmail={showEmail}
      emailLabel={t('chrome:about.email')}
      showPrivacy={showPrivacy}
      privacyLabel={t('chrome:about.privacy')}
      onEmailTap={onEmailTap}
      onPrivacyTap={onPrivacyTap}
    />
  );
}
