import * as fs from 'fs';
import * as path from 'path';
import { extractStrokes } from './build-stroke-data-deva';

const FIXTURE = path.join(__dirname, '__fixtures__', 'devanagari-a.svg');

describe('build-stroke-data-deva extractStrokes', () => {
  const svgText = fs.readFileSync(FIXTURE, 'utf-8');

  it('extracts the expected number of strokes from devanagari-a.svg (अ)', () => {
    const r = extractStrokes(svgText);
    expect(r.error).toBeUndefined();
    expect(r.strokes.length).toBeGreaterThanOrEqual(4);
    expect(r.strokes.length).toBe(r.medians.length);
  });

  it('emits exactly 15 medians per stroke', () => {
    const r = extractStrokes(svgText);
    for (const m of r.medians) {
      expect(m.length).toBe(15);
    }
  });

  it('keeps every coordinate inside the 0..1024 box', () => {
    const r = extractStrokes(svgText);
    for (const m of r.medians) {
      for (const [x, y] of m) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(1024);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(1024);
      }
    }
  });

  it('rebuilt path d strings start with M and contain path commands', () => {
    const r = extractStrokes(svgText);
    for (const d of r.strokes) {
      expect(d).toMatch(/^M/);
      expect(d).toMatch(/[LQC]/);
    }
  });

  it('all median coords are within the 0..1024 bbox', () => {
    const r = extractStrokes(svgText);
    for (let i = 0; i < r.strokes.length; i++) {
      for (const [x, y] of r.medians[i]) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(1024);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(1024);
      }
    }
  });
});
