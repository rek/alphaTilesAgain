/**
 * split-syllable-audio.ts
 *
 * Cuts the Cantonese (yue) word recordings into per-syllable clips.
 *
 * In Cantonese one written character is one spoken syllable, so most
 * `audio/words/*.mp3` clips are multi-syllable utterances. This tool produces
 * one isolated-syllable clip per unique character so the syllable game has
 * audio to play.
 *
 * Pipeline (see openspec/changes/yue-syllable-game/design.md):
 *   1. Parse languages/yue/aa_wordlist.txt — English LWC (= audio filename) +
 *      Chinese Language-of-Play string.
 *   2. For each unique character, pick ONE source occurrence:
 *        tier 1 — the character is itself a one-character word: copy that
 *                 word's recording verbatim (cleanest — a real isolated clip).
 *        tier 2 — the character appears word-initially somewhere: cut the
 *                 first slice from the shortest such word.
 *        tier 3 — the character only appears non-initially: cut its slice
 *                 from the shortest such word.
 *   3. Split each source word once via `ffmpeg silencedetect`. If exactly
 *      N-1 interior gaps are found, cut at the gap midpoints; otherwise fall
 *      back to equal-duration division and flag the word for review.
 *   4. Trim leading/trailing silence from every produced clip.
 *   5. Emit languages/yue/audio/syllables/<char>.mp3 (151 files),
 *      languages/yue/aa_syllables.txt (151 rows), and a review report at
 *      tools/data/yue-syllable-cuts/review-report.json.
 *
 * Requires `ffmpeg` and `ffprobe` on PATH.
 *
 * Run: npx tsx tools/split-syllable-audio.ts [--noise -16] [--min-gap 0.06] [--dry-run]
 *
 * Defaults (--noise -16 dB, --min-gap 0.06 s) were tuned against the actual
 * yue recordings: an aggressive amplitude floor catches the dip between
 * connected syllables, while a 60 ms minimum gap rejects within-syllable
 * blips. ~75 of 139 cuts land a real gap; the rest fall back to
 * equal-duration division (see design.md).
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { parseWordlist } from '../libs/shared/util-lang-pack-parser/src';

// ---------------------------------------------------------------------------
// Paths & constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..');
const LANG_DIR = path.join(REPO_ROOT, 'languages', 'yue');
const WORDLIST = path.join(LANG_DIR, 'aa_wordlist.txt');
const COLORS = path.join(LANG_DIR, 'aa_colors.txt');
const WORDS_AUDIO_DIR = path.join(LANG_DIR, 'audio', 'words');
const SYLL_AUDIO_DIR = path.join(LANG_DIR, 'audio', 'syllables');
const SYLLABLES_TXT = path.join(LANG_DIR, 'aa_syllables.txt');
const REVIEW_DIR = path.join(REPO_ROOT, 'tools', 'data', 'yue-syllable-cuts');
const REVIEW_REPORT = path.join(REVIEW_DIR, 'review-report.json');

/** Silence intervals whose midpoint falls in the leading/trailing EDGE_FRAC of
 *  the clip are treated as edge padding, not inter-syllable gaps. */
const EDGE_FRAC = 0.1;

/** Keep this much silence as padding when trimming, so quiet onsets survive. */
const TRIM_FILTER =
  'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02:detection=peak,' +
  'areverse,' +
  'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02:detection=peak,' +
  'areverse';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  noiseDb: number;
  minGap: number;
  dryRun: boolean;
} {
  let noiseDb = -16;
  let minGap = 0.06;
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--noise') noiseDb = Number(argv[++i]);
    else if (a === '--min-gap') minGap = Number(argv[++i]);
    else if (a === '--dry-run') dryRun = true;
    else die(`unknown flag: ${a}`);
  }
  if (Number.isNaN(noiseDb)) die('--noise must be a number (dB)');
  if (Number.isNaN(minGap) || minGap <= 0) die('--min-gap must be a positive number (seconds)');
  return { noiseDb, minGap, dryRun };
}

function die(msg: string): never {
  console.error(`\n[split-syllable-audio] ERROR: ${msg}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// ffmpeg / ffprobe helpers
// ---------------------------------------------------------------------------

function requireBinary(bin: string): void {
  const r = spawnSync(bin, ['-version'], { encoding: 'utf8' });
  if (r.status !== 0) die(`\`${bin}\` not found on PATH — install ffmpeg`);
}

/** Clip duration in seconds. */
function probeDuration(file: string): number {
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) die(`ffprobe failed for ${file}: ${r.stderr}`);
  const d = parseFloat(r.stdout.trim());
  if (Number.isNaN(d) || d <= 0) die(`ffprobe returned no duration for ${file}`);
  return d;
}

type SilenceInterval = { start: number; end: number };

/** Run silencedetect and return the detected silence intervals. */
function detectSilence(file: string, noiseDb: number, minGap: number): SilenceInterval[] {
  const r = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-i', file, '-af', `silencedetect=noise=${noiseDb}dB:d=${minGap}`, '-f', 'null', '-'],
    { encoding: 'utf8' },
  );
  // ffmpeg writes silencedetect output to stderr; exit status is 0 on success.
  const text = `${r.stderr ?? ''}`;
  const intervals: SilenceInterval[] = [];
  let pendingStart: number | null = null;
  for (const line of text.split('\n')) {
    const startM = line.match(/silence_start:\s*(-?[\d.]+)/);
    if (startM) {
      pendingStart = parseFloat(startM[1]);
      continue;
    }
    const endM = line.match(/silence_end:\s*(-?[\d.]+)/);
    if (endM && pendingStart !== null) {
      intervals.push({ start: pendingStart, end: parseFloat(endM[1]) });
      pendingStart = null;
    }
  }
  return intervals;
}

/** Write a time-range slice of `src` to `out`, trimming edge silence. */
function cutPiece(src: string, out: string, start: number, end: number): void {
  const r = spawnSync(
    'ffmpeg',
    [
      '-hide_banner', '-y',
      '-i', src,
      '-ss', start.toFixed(3),
      '-to', end.toFixed(3),
      '-af', TRIM_FILTER,
      '-c:a', 'libmp3lame', '-q:a', '4',
      out,
    ],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) die(`ffmpeg cut failed for ${out}: ${r.stderr}`);
}

/** Copy `src` to `out`, trimming edge silence (used for verbatim one-char sources). */
function copyTrimmed(src: string, out: string): void {
  const r = spawnSync(
    'ffmpeg',
    [
      '-hide_banner', '-y',
      '-i', src,
      '-af', TRIM_FILTER,
      '-c:a', 'libmp3lame', '-q:a', '4',
      out,
    ],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) die(`ffmpeg copy failed for ${out}: ${r.stderr}`);
}

// ---------------------------------------------------------------------------
// Wordlist model
// ---------------------------------------------------------------------------

type WordEntry = {
  englishLwc: string; // audio/words/<englishLwc>.mp3
  chars: string[]; // Chinese characters of the Language-of-Play string
};

type Occurrence = {
  word: WordEntry;
  charIndex: number;
};

function loadWords(): WordEntry[] {
  const raw = fs.readFileSync(WORDLIST, 'utf8');
  const { rows } = parseWordlist(raw);
  const words: WordEntry[] = [];
  for (const row of rows) {
    const englishLwc = row.wordInLWC.trim();
    const chars = [...row.wordInLOP.trim()];
    if (englishLwc === '' || chars.length === 0) continue;
    words.push({ englishLwc, chars });
  }
  return words;
}

function colorCount(): number {
  const raw = fs.readFileSync(COLORS, 'utf8');
  const dataLines = raw.split('\n').slice(1).filter((l) => l.trim() !== '');
  return dataLines.length || 1;
}

// ---------------------------------------------------------------------------
// Source selection (design.md D3)
// ---------------------------------------------------------------------------

type Tier = 1 | 2 | 3;

type SourcePick = {
  char: string;
  tier: Tier;
  word: WordEntry;
  charIndex: number;
};

function pickSources(words: WordEntry[], orderedChars: string[]): Map<string, SourcePick> {
  const oneCharWord = new Map<string, WordEntry>();
  const occurrences = new Map<string, Occurrence[]>();

  for (const word of words) {
    if (word.chars.length === 1 && !oneCharWord.has(word.chars[0])) {
      oneCharWord.set(word.chars[0], word);
    }
    word.chars.forEach((char, charIndex) => {
      const list = occurrences.get(char) ?? [];
      list.push({ word, charIndex });
      occurrences.set(char, list);
    });
  }

  const picks = new Map<string, SourcePick>();
  for (const char of orderedChars) {
    // tier 1 — character is itself a one-character word.
    const verbatim = oneCharWord.get(char);
    if (verbatim) {
      picks.set(char, { char, tier: 1, word: verbatim, charIndex: 0 });
      continue;
    }
    const occ = occurrences.get(char) ?? [];
    // tier 2 — word-initial occurrence; prefer the shortest word.
    const initial = occ
      .filter((o) => o.charIndex === 0)
      .sort((a, b) => a.word.chars.length - b.word.chars.length)[0];
    if (initial) {
      picks.set(char, { char, tier: 2, word: initial.word, charIndex: 0 });
      continue;
    }
    // tier 3 — non-initial occurrence; prefer the shortest word.
    const nonInitial = [...occ].sort((a, b) => a.word.chars.length - b.word.chars.length)[0];
    if (!nonInitial) die(`character ${char} has no occurrence in the wordlist`);
    picks.set(char, { char, tier: 3, word: nonInitial.word, charIndex: nonInitial.charIndex });
  }
  return picks;
}

// ---------------------------------------------------------------------------
// Splitting
// ---------------------------------------------------------------------------

type SplitPath = 'verbatim' | 'silence' | 'equal-duration';

/** Compute the [start,end] ranges for each character of a multi-character word. */
function computeRanges(
  file: string,
  charCount: number,
  noiseDb: number,
  minGap: number,
): { ranges: Array<[number, number]>; splitPath: SplitPath } {
  const duration = probeDuration(file);
  const expectedGaps = charCount - 1;

  const interior = detectSilence(file, noiseDb, minGap)
    .map((iv) => ({ ...iv, mid: (iv.start + iv.end) / 2 }))
    .filter((iv) => iv.mid > duration * EDGE_FRAC && iv.mid < duration * (1 - EDGE_FRAC))
    .sort((a, b) => a.mid - b.mid);

  if (interior.length === expectedGaps) {
    // High-confidence: cut at the gap midpoints.
    const cuts = interior.map((iv) => iv.mid);
    const bounds = [0, ...cuts, duration];
    const ranges = bounds.slice(0, -1).map((s, i) => [s, bounds[i + 1]] as [number, number]);
    return { ranges, splitPath: 'silence' };
  }

  // Low-confidence: equal-duration division.
  const slice = duration / charCount;
  const ranges = Array.from(
    { length: charCount },
    (_, i) => [i * slice, (i + 1) * slice] as [number, number],
  );
  return { ranges, splitPath: 'equal-duration' };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type ReviewEntry = {
  char: string;
  sourceWord: string;
  sourceEnglishLwc: string;
  tier: Tier;
  splitPath: SplitPath;
  charIndex: number;
  pieceDurationMs: number;
};

function main(): void {
  const { noiseDb, minGap, dryRun } = parseArgs(process.argv.slice(2));
  requireBinary('ffmpeg');
  requireBinary('ffprobe');

  const words = loadWords();
  if (words.length === 0) die('aa_wordlist.txt parsed to zero words');

  // Characters in first-appearance order — drives aa_syllables.txt row order
  // and the color cycle.
  const orderedChars: string[] = [];
  const seen = new Set<string>();
  for (const word of words) {
    for (const char of word.chars) {
      if (!seen.has(char)) {
        seen.add(char);
        orderedChars.push(char);
      }
    }
  }

  const picks = pickSources(words, orderedChars);

  // Group multi-character source words so each is split exactly once.
  type SplitJob = { word: WordEntry; neededIndices: Set<number> };
  const splitJobs = new Map<string, SplitJob>();
  for (const pick of picks.values()) {
    if (pick.tier === 1) continue;
    const job = splitJobs.get(pick.word.englishLwc) ?? {
      word: pick.word,
      neededIndices: new Set<number>(),
    };
    job.neededIndices.add(pick.charIndex);
    splitJobs.set(pick.word.englishLwc, job);
  }

  if (!dryRun) fs.mkdirSync(SYLL_AUDIO_DIR, { recursive: true });
  fs.mkdirSync(REVIEW_DIR, { recursive: true });

  // Run every split job; remember each needed piece's [start,end] + splitPath.
  const pieceRange = new Map<string, [number, number]>(); // `${englishLwc}#${idx}` -> range
  const wordSplitPath = new Map<string, SplitPath>();
  for (const job of splitJobs.values()) {
    const src = path.join(WORDS_AUDIO_DIR, `${job.word.englishLwc}.mp3`);
    if (!fs.existsSync(src)) die(`missing source audio: ${src}`);
    const { ranges, splitPath } = computeRanges(src, job.word.chars.length, noiseDb, minGap);
    wordSplitPath.set(job.word.englishLwc, splitPath);
    for (const idx of job.neededIndices) {
      pieceRange.set(`${job.word.englishLwc}#${idx}`, ranges[idx]);
    }
  }

  // Produce one clip per character; collect review + duration data.
  const review: ReviewEntry[] = [];
  const durationsMs = new Map<string, number>();
  for (const char of orderedChars) {
    const pick = picks.get(char);
    if (!pick) die(`no source pick for character ${char}`);
    const src = path.join(WORDS_AUDIO_DIR, `${pick.word.englishLwc}.mp3`);
    if (!fs.existsSync(src)) die(`missing source audio: ${src}`);
    const out = path.join(SYLL_AUDIO_DIR, `${char}.mp3`);

    let splitPath: SplitPath;
    if (pick.tier === 1) {
      splitPath = 'verbatim';
      if (!dryRun) copyTrimmed(src, out);
    } else {
      const wordPath = wordSplitPath.get(pick.word.englishLwc);
      const range = pieceRange.get(`${pick.word.englishLwc}#${pick.charIndex}`);
      if (!wordPath || !range) die(`missing split result for ${pick.word.englishLwc}#${pick.charIndex}`);
      splitPath = wordPath;
      if (!dryRun) cutPiece(src, out, range[0], range[1]);
    }

    const pieceDurationMs = dryRun ? 0 : Math.round(probeDuration(out) * 1000);
    durationsMs.set(char, pieceDurationMs);
    review.push({
      char,
      sourceWord: pick.word.chars.join(''),
      sourceEnglishLwc: pick.word.englishLwc,
      tier: pick.tier,
      splitPath,
      charIndex: pick.charIndex,
      pieceDurationMs,
    });
  }

  // Write aa_syllables.txt — Syllable, Or1, Or2, Or3, SyllableAudioName, Duration, Color.
  const colors = colorCount();
  const header = ['Syllable', 'Or1', 'Or2', 'Or3', 'SyllableAudioName', 'Duration', 'Color'].join('\t');
  const rows = orderedChars.map((char, i) =>
    [char, '', '', '', char, String(durationsMs.get(char) ?? 0), String(i % colors)].join('\t'),
  );
  const syllablesTxt = `${header}\n${rows.join('\n')}\n`;
  if (!dryRun) fs.writeFileSync(SYLLABLES_TXT, syllablesTxt, 'utf8');

  // Write the review report.
  fs.writeFileSync(REVIEW_REPORT, `${JSON.stringify(review, null, 2)}\n`, 'utf8');

  // stdout summary.
  const byTier = { 1: 0, 2: 0, 3: 0 };
  const byPath: Record<SplitPath, number> = { verbatim: 0, silence: 0, 'equal-duration': 0 };
  for (const r of review) {
    byTier[r.tier]++;
    byPath[r.splitPath]++;
  }
  const equalDurationChars = review.filter((r) => r.splitPath === 'equal-duration');

  console.log(`\n[split-syllable-audio] ${dryRun ? 'DRY RUN — ' : ''}done`);
  console.log(`  unique characters:   ${orderedChars.length}`);
  console.log(`  source tiers:        tier1 verbatim=${byTier[1]}  tier2 first-cut=${byTier[2]}  tier3 later-cut=${byTier[3]}`);
  console.log(`  split paths:         verbatim=${byPath.verbatim}  silence=${byPath.silence}  equal-duration=${byPath['equal-duration']}`);
  console.log(`  multi-char words split: ${splitJobs.size}`);
  if (equalDurationChars.length > 0) {
    console.log(`\n  REVIEW FIRST — ${equalDurationChars.length} clip(s) used the equal-duration fallback:`);
    for (const r of equalDurationChars) {
      console.log(`    ${r.char}  (from ${r.sourceWord} / ${r.sourceEnglishLwc}, index ${r.charIndex})`);
    }
  }
  console.log(`\n  review report: ${path.relative(REPO_ROOT, REVIEW_REPORT)}`);
  if (!dryRun) {
    console.log(`  audio written: ${path.relative(REPO_ROOT, SYLL_AUDIO_DIR)}/ (${orderedChars.length} files)`);
    console.log(`  index written: ${path.relative(REPO_ROOT, SYLLABLES_TXT)}`);
  }
  console.log('');
}

main();
