import * as fs from 'fs';
import * as path from 'path';
import { webAppManifest } from './webAppManifest';

const langInfo = (lang: string) =>
  fs.readFileSync(path.join(__dirname, '..', 'languages', lang, 'aa_langinfo.txt'), 'utf8');

describe('webAppManifest', () => {
  it('yue: pack game name, zh-HK document language, bare app id', () => {
    const m = webAppManifest({ lang: 'yue', langInfoSrc: langInfo('yue') });
    expect(m.name).toBe('學廣話');
    expect(m.short_name).toBe('學廣話');
    expect(m.lang).toBe('zh-HK');
    expect(m.related_applications[0].id).toBe('com.makektm.alphatiles');
  });

  it('eng: keeps the AlphaTiles brand, English document language', () => {
    const m = webAppManifest({ lang: 'eng', langInfoSrc: langInfo('eng') });
    expect(m.name).toBe('AlphaTiles');
    expect(m.lang).toBe('en');
    expect(m.related_applications[0].id).toBe('com.makektm.alphatiles.eng');
  });

  it('falls back to the local language name when the pack has no game name', () => {
    const src = 'Item\tAnswer\n1. Lang Name (In Local Lang)\tTeochew\n';
    expect(webAppManifest({ lang: 'xyz', langInfoSrc: src }).name).toBe('Teochew');
  });
});
