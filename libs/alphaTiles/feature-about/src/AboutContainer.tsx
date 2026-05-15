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
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useTranslation } from '@shared/util-i18n';
import { useTrackScreenMount } from '@shared/util-analytics';
import { AboutScreen } from './AboutScreen';

/** AlphaTiles project home page — same for every language pack. */
const PROJECT_URL = 'https://rek.github.io/alphaTilesAgain/';
/** Public issue tracker for bug reports and feedback. */
const ISSUES_URL = 'https://github.com/rek/alphaTilesAgain/issues';

function isAbsent(value: string | undefined): boolean {
  return value === undefined || value === '' || value.toLowerCase() === 'none';
}

/**
 * Opens an external URL. Native gets the in-app browser; web uses
 * Linking (a plain new tab) since expo-web-browser opens a popup
 * window that browsers commonly block.
 */
function openUrl(url: string): void {
  if (Platform.OS === 'web') {
    void Linking.openURL(url);
  } else {
    void WebBrowser.openBrowserAsync(url);
  }
}

export function AboutContainer(): React.JSX.Element {
  const assets = useLangAssets();
  const { t } = useTranslation();
  const router = useRouter();
  useTrackScreenMount('/about');

  const langInfo = assets.langInfo;

  // aa_langinfo items (0-based index after stripping header)
  const localLangName = langInfo.find('Lang Name (In Local Lang)') ?? '';
  const englishName = langInfo.find('Lang Name (In English)') ?? '';
  const country = langInfo.find('Country') ?? '';
  const creditsText = langInfo.find('Audio and image credits') ?? '';
  const secondaryCreditsText = langInfo.find('Audio and image credits (lang 2)') ?? '';
  const email = langInfo.find('Email');

  // Visibility flags per design.md §D7
  const showEmail = !isAbsent(email);
  const showSecondaryCredits = !isAbsent(secondaryCreditsText);

  // Mirroring Java About.java names_plus_countryA vs B:
  // If local name == English name, format with just one name.
  const sameNames = localLangName === englishName;
  const langPlusCountry = sameNames
    ? `${localLangName} (${country})`
    : `${localLangName} / ${englishName} (${country})`;

  // nativeApplicationVersion is null on web — fall back to the Expo config version.
  const version =
    Constants.expoConfig?.version ?? Application.nativeApplicationVersion ?? '—';
  const versionLabel = t('chrome:about.version', { version });

  const onEmailTap = (): void => {
    if (email) {
      void Linking.openURL(`mailto:${email}`);
    }
  };

  const onWebsiteTap = (): void => { openUrl(PROJECT_URL); };
  const onReportIssueTap = (): void => { openUrl(ISSUES_URL); };

  return (
    <AboutScreen
      onBack={() => { router.back(); }}
      versionLabel={versionLabel}
      localName={localLangName}
      langPlusCountry={langPlusCountry}
      creditsHeading={t('chrome:about.credits')}
      credits={creditsText}
      showSecondaryCredits={showSecondaryCredits}
      secondaryCredits={secondaryCreditsText}
      showEmail={showEmail}
      emailLabel={t('chrome:about.email')}
      onEmailTap={onEmailTap}
      websiteLabel={t('chrome:about.website')}
      onWebsiteTap={onWebsiteTap}
      reportIssueLabel={t('chrome:about.reportIssue')}
      onReportIssueTap={onReportIssueTap}
    />
  );
}
