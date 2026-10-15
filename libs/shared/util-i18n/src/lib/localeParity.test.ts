/**
 * Every non-English chrome locale must mirror locales/en.json exactly:
 * same key set and same {{placeholders}} per key. Guards against drift when
 * keys are added to en.json without updating translations.
 */

import en from '../../../../../locales/en.json';
import zhHK from '../../../../../locales/zh-HK.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [k, v]) => {
    const path = prefix ? `${prefix}/${k}` : k;
    return typeof v === 'string' ? { ...acc, [path]: v } : { ...acc, ...flatten(v, path) };
  }, {});
}

function placeholders(value: string): string[] {
  return (value.match(/{{\s*[\w.]+\s*}}/g) ?? []).map((p) => p.replace(/\s/g, '')).sort();
}

const enFlat = flatten(en as Tree);

describe.each([['zh-HK', zhHK]])('locales/%s.json parity with en.json', (_name, locale) => {
  const flat = flatten(locale as Tree);

  test('has exactly the same key set', () => {
    expect(Object.keys(flat).sort()).toEqual(Object.keys(enFlat).sort());
  });

  test('every value is a non-empty string', () => {
    for (const value of Object.values(flat)) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  test('every key keeps the same interpolation placeholders', () => {
    for (const [key, value] of Object.entries(enFlat)) {
      expect({ key, placeholders: placeholders(flat[key] ?? '') }).toEqual({
        key,
        placeholders: placeholders(value),
      });
    }
  });
});
