/**
 * Container for the Resources screen.
 *
 * Reads resources array from lang assets, opens links via expo-web-browser,
 * fires analytics on mount.
 *
 * Design decisions: D3 (external link handling), D6 (aa_resources.txt parsing),
 * D9 (analytics).
 */

import React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useTranslation } from '@shared/util-i18n';
import { useTrackScreenMount } from '@shared/util-analytics';
import { ResourcesScreen } from './ResourcesScreen';

export function ResourcesContainer(): React.JSX.Element {
  const assets = useLangAssets();
  const { t } = useTranslation();
  useTrackScreenMount('/resources');

  // assets.resources is ParsedResources = { rows: Array<{ name, link, image }> }
  const rows = assets.resources.rows;
  const isEmpty = rows.length === 0;

  const onResourceTap = (url: string): void => {
    void WebBrowser.openBrowserAsync(url);
  };

  return (
    <ResourcesScreen
      isEmpty={isEmpty}
      resources={rows}
      emptyMessage={t('chrome:resources.empty')}
      onResourceTap={onResourceTap}
    />
  );
}
