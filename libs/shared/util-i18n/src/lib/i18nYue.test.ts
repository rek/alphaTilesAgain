/**
 * yue build → chrome resolves in zh-HK regardless of device locale; keys
 * absent from zh-HK fall back to English.
 */

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { appLang: 'yue' } } },
}));

import { i18n } from './i18nInstance';
import { initI18n } from './initI18n';
import { chromeLocaleForBuildLang } from './chromeLocaleForBuildLang';

describe('chromeLocaleForBuildLang', () => {
  test('yue → zh-HK', () => {
    expect(chromeLocaleForBuildLang('yue')).toBe('zh-HK');
  });

  test('pack without override → undefined (device locale decides)', () => {
    expect(chromeLocaleForBuildLang('eng')).toBeUndefined();
  });
});

describe('initI18n on yue build', () => {
  beforeAll(async () => {
    await initI18n({ deviceLocale: 'en-US' });
  });

  test('English device still gets zh-HK chrome', () => {
    expect(i18n.language).toBe('zh-HK');
    expect(i18n.t('chrome:back')).toBe('返回');
  });

  test('interpolation works in zh-HK', () => {
    expect(i18n.t('chrome:menu.score', { points: 7 })).toBe('分數：7');
  });

  test('key missing from zh-HK falls back to English', () => {
    i18n.addResource('en', 'chrome', 'en_only_probe', 'English only');
    expect(i18n.t('chrome:en_only_probe')).toBe('English only');
  });
});
