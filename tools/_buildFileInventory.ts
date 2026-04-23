/**
 * Walk a language pack directory and build a FileInventory.
 *
 * Basenames are stripped of extensions to match the convention in aa_*.txt files
 * (e.g. audioName 'zz_tile_b' matches file 'zz_tile_b.mp3').
 *
 * `sizes` map uses the basename (without ext) as key — needed for zero-byte
 * and oversize audio checks.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { FileInventory } from '../libs/shared/util-lang-pack-validator/src/FileInventory';

function listDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs.readdirSync(dir).filter((f) => {
      const stat = fs.statSync(path.join(dir, f));
      return stat.isFile();
    });
  } catch {
    return [];
  }
}

function stripExt(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot > 0 ? filename.substring(0, dot) : filename;
}

function collectWithSizes(
  dir: string,
  sizes: Record<string, number>,
): string[] {
  const files = listDir(dir);
  const basenames: string[] = [];
  for (const f of files) {
    const base = stripExt(f);
    basenames.push(base);
    try {
      const stat = fs.statSync(path.join(dir, f));
      sizes[base] = stat.size;
    } catch {
      sizes[base] = 0;
    }
  }
  return basenames;
}

export function buildFileInventory(langDir: string): FileInventory {
  const sizes: Record<string, number> = {};

  const fonts = listDir(path.join(langDir, 'fonts'))
    .filter((f) => f.endsWith('.ttf') || f.endsWith('.otf'))
    .map(stripExt);

  const avatars = listDir(path.join(langDir, 'images', 'avatars')).map(stripExt);
  const avataricons = listDir(path.join(langDir, 'images', 'avataricons')).map(stripExt);
  const wordImages = listDir(path.join(langDir, 'images', 'words')).map(stripExt);
  const tileImages = listDir(path.join(langDir, 'images', 'tiles')).map(stripExt);

  const tileAudio = collectWithSizes(path.join(langDir, 'audio', 'tiles'), sizes);
  const wordAudio = collectWithSizes(path.join(langDir, 'audio', 'words'), sizes);
  const syllableAudio = collectWithSizes(path.join(langDir, 'audio', 'syllables'), sizes);
  const instructionAudio = collectWithSizes(path.join(langDir, 'audio', 'instructions'), sizes);

  // Optional icon / splash
  const iconPath = path.join(langDir, 'images', 'icon.png');
  const splashPath = path.join(langDir, 'images', 'splash.png');

  return {
    fonts,
    avatars,
    avataricons,
    wordImages,
    tileImages,
    tileAudio,
    wordAudio,
    syllableAudio,
    instructionAudio,
    sizes,
    icon: fs.existsSync(iconPath) ? 'icon' : undefined,
    splash: fs.existsSync(splashPath) ? 'splash' : undefined,
  };
}
