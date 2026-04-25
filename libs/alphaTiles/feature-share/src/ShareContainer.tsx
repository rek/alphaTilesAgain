/**
 * Container for the Share screen.
 *
 * Reads share URL from lang assets, determines availability,
 * wires native share sheet, fires analytics on mount.
 *
 * Design decisions: D4 (share mechanism), D5 (aa_share.txt parsing), D9 (analytics).
 */

import React from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useTranslation } from '@shared/util-i18n';
import { useTrackScreenMount } from '@shared/util-analytics';
import { ShareScreen } from './ShareScreen';

export function ShareContainer(): React.JSX.Element {
  const assets = useLangAssets();
  const { t } = useTranslation();
  const router = useRouter();
  useTrackScreenMount('/share');

  // assets.share is a bare string from parseShare; empty string means unavailable
  const url = assets.share ?? '';
  const available = url.length > 0;

  const onShareTap = (): void => {
    void Share.share({ message: url, url });
  };

  return (
    <ShareScreen
      onBack={() => { router.back(); }}
      available={available}
      url={url}
      instructions={t('chrome:share.instructions')}
      shareButtonLabel={t('chrome:share.button')}
      qrAltLabel={t('chrome:share.qrAlt')}
      unavailableMessage={t('chrome:share.unavailable')}
      onShareTap={onShareTap}
    />
  );
}
