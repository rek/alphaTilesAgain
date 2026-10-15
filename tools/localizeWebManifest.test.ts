import * as fs from 'fs';
import * as path from 'path';
import { localizeWebManifest } from './localizeWebManifest';

const template = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'apps', 'alphaTiles', 'public', 'manifest.json'), 'utf8'),
) as Record<string, unknown>;

function pack(lang: string) {
  const dir = path.join(__dirname, '..', 'languages', lang);
  return {
    langInfo: fs.readFileSync(path.join(dir, 'aa_langinfo.txt'), 'utf8'),
    share: fs.readFileSync(path.join(dir, 'aa_share.txt'), 'utf8'),
  };
}

describe('localizeWebManifest', () => {
  it('yue: pack language name, zh-HK UI locale, yue Play id', () => {
    const m = localizeWebManifest(template, pack('yue'));
    expect(m['name']).toBe('廣東話');
    expect(m['short_name']).toBe('廣東話');
    expect(m['lang']).toBe('zh-HK');
    expect(m['related_applications']).toEqual([{ platform: 'play', id: 'com.makektm.alphatiles' }]);
    expect(m['icons']).toEqual(template['icons']);
  });

  it('eng: keeps AlphaTiles brand, canonical en tag, eng Play id (not the yue app)', () => {
    const m = localizeWebManifest(template, pack('eng'));
    expect(m['name']).toBe('AlphaTiles');
    expect(m['lang']).toBe('en');
    expect(m['related_applications']).toEqual([
      { platform: 'play', id: 'org.alphatilesapps.alphatiles.blue.engEnglish4' },
    ]);
  });

  it('no Play link → no related_applications; missing lang name → game name', () => {
    const m = localizeWebManifest(template, {
      langInfo: 'Item\tAnswer\n7. Game Name (In Local Lang)\tXx\n4. Ethnologue code\ttpx\n',
      share: 'Link\n',
    });
    expect(m['name']).toBe('Xx');
    expect(m['lang']).toBe('tpx');
    expect(m['related_applications']).toEqual([]);
  });
});
