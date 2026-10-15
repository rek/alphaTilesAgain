import * as fs from 'fs';
import * as path from 'path';
import { ARPHIC_PUBLIC_LICENSE_TEXT } from './arphicLicense';
import { STROKE_DATA_ATTRIBUTION } from './strokeDataAttribution';

describe('ARPHIC_PUBLIC_LICENSE_TEXT', () => {
  it('matches the vendored ARPHICPL.TXT byte for byte (APL section 1: unaltered)', () => {
    const file = fs.readFileSync(path.join(__dirname, '..', '..', 'ARPHICPL.TXT'), 'utf8');
    expect(ARPHIC_PUBLIC_LICENSE_TEXT).toBe(file);
  });

  it('carries the copyright line and the no-warranty section', () => {
    expect(ARPHIC_PUBLIC_LICENSE_TEXT).toContain('Copyright (C) 1999 Arphic Technology Co., Ltd.');
    expect(ARPHIC_PUBLIC_LICENSE_TEXT).toContain('7. NO WARRANTY');
  });
});

describe('STROKE_DATA_ATTRIBUTION', () => {
  it('names upstream, licence, modification and where to get the modified data', () => {
    expect(STROKE_DATA_ATTRIBUTION).toContain('Make Me a Hanzi');
    expect(STROKE_DATA_ATTRIBUTION).toContain('Arphic Public License');
    expect(STROKE_DATA_ATTRIBUTION).toContain('Modified by AlphaTiles');
    expect(STROKE_DATA_ATTRIBUTION).toContain('github.com/rek/alphaTilesAgain');
    expect(STROKE_DATA_ATTRIBUTION).toContain('NO WARRANTY');
  });
});
