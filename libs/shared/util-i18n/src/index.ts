// i18next engine init — call once at app boot
export { initI18n } from './lib/initI18n';
export type { InitI18nOptions } from './lib/initI18n';

// Content namespace registration — call after lang pack parses
export { registerContentNamespaces } from './lib/registerContentNamespaces';
export type { ContentNamespaces } from './lib/registerContentNamespaces';

// React provider — mount in app/_layout.tsx
export { I18nProvider } from './lib/I18nProvider';

// Hooks — re-exported so call sites import from @shared/util-i18n, not react-i18next directly
export { useTranslation } from 'react-i18next';
export { useContentT } from './lib/useContentT';

// Typed t — for non-hook call sites (e.g. outside React tree)
export { t } from 'i18next';
