import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Static analysis tests for Sudan presenter purity + NO_TRACKER guard.
 * Spec: openspec/changes/game-sudan/specs/sudan/spec.md.
 */

const containerPath = join(__dirname, '..', 'SudanContainer.tsx');
const screenPath = join(__dirname, '..', 'SudanScreen.tsx');

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('Sudan NO_TRACKER guard', () => {
  it('SudanContainer does not call incrementPointsAndTracker', () => {
    const src = stripComments(readFileSync(containerPath, 'utf8'));
    expect(/incrementPointsAndTracker\s*\(/.test(src)).toBe(false);
  });

  it('SudanScreen does not import react-i18next', () => {
    const src = readFileSync(screenPath, 'utf8');
    expect(/from\s+['"]react-i18next['"]/.test(src)).toBe(false);
    expect(/import\s+.*\buseTranslation\b/.test(src)).toBe(false);
  });

  it('SudanScreen does not call shell or precompute hooks', () => {
    const src = stripComments(readFileSync(screenPath, 'utf8'));
    expect(/\buseGameShell\s*\(/.test(src)).toBe(false);
    expect(/\buseLangAssets\s*\(/.test(src)).toBe(false);
    expect(/\buseAudio\s*\(/.test(src)).toBe(false);
    expect(/\busePrecompute\s*\(/.test(src)).toBe(false);
  });
});
