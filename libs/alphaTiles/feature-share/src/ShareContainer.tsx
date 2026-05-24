/**
 * Container for the Share screen.
 *
 * Reads share URL from lang assets, determines availability,
 * picks the platform share path, fires analytics on mount.
 *
 * Web has no React Native share sheet — Share.share throws there.
 * When the browser exposes navigator.share we use it; otherwise we
 * copy the URL to the clipboard and surface a "copied" label.
 *
 * Design decisions: D4 (share mechanism), D5 (aa_share.txt parsing), D9 (analytics).
 */

import React from 'react';
import { Platform, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useTranslation } from '@shared/util-i18n';
import { useTrackScreenMount } from '@shared/util-analytics';
import { ShareScreen } from './ShareScreen';

/**
 * Shares `url` via the best mechanism for the platform.
 * Resolves true when the URL was copied to the clipboard (web
 * fallback) so the caller can show a "copied" label instead.
 */
async function shareUrl(url: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const nav = typeof navigator === 'undefined' ? undefined : navigator;
    if (nav?.share) {
      try {
        await nav.share({ url });
      } catch {
        // user dismissed the share sheet
      }
      return false;
    }
    if (nav?.clipboard) {
      try {
        await nav.clipboard.writeText(url);
        return true;
      } catch {
        // clipboard permission denied
      }
    }
    return false;
  }
  try {
    await Share.share({ message: url, url });
  } catch {
    // user dismissed the share sheet
  }
  return false;
}

export function ShareContainer(): React.JSX.Element {
  const assets = useLangAssets();
  const { t } = useTranslation();
  const router = useRouter();
  useTrackScreenMount('/share');

  // assets.share is a bare string from parseShare; empty string means unavailable
  const url = assets.share ?? '';
  const available = url.length > 0;

  const [copied, setCopied] = React.useState(false);

  const onShareTap = (): void => {
    void shareUrl(url).then((didCopy) => {
      if (didCopy) setCopied(true);
    });
  };

  return (
    <ShareScreen
      onBack={() => { router.back(); }}
      available={available}
      url={url}
      instructions={t('chrome:share.instructions')}
      shareButtonLabel={copied ? t('chrome:share.copied') : t('chrome:share.button')}
      qrAltLabel={t('chrome:share.qrAlt')}
      unavailableMessage={t('chrome:share.unavailable')}
      onShareTap={onShareTap}
      backLabel={t('chrome:back')}
    />
  );
}
