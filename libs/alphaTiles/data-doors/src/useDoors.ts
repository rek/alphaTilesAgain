import { useMemo } from 'react';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { doorsOf } from './doorsOf';

/** Every Door of the loaded pack, file order (see `doorsOf`). Stable for the session. */
export function useDoors() {
  const assets = useLangAssets();
  return useMemo(() => doorsOf(assets), [assets]);
}
