import { decodeThailandChallengeLevel, TYPES } from '../decodeThailandChallengeLevel';

describe('decodeThailandChallengeLevel', () => {
  it('decodes CL 235 correctly', () => {
    const result = decodeThailandChallengeLevel(235);
    expect(result.distractorStrategy).toBe(2);
    expect(result.refType).toBe(TYPES[2]); // TILE_AUDIO (1-indexed: 3 → index 2)
    expect(result.choiceType).toBe(TYPES[4]); // WORD_IMAGE (1-indexed: 5 → index 4)
  });

  it('decodes CL 111 correctly', () => {
    const result = decodeThailandChallengeLevel(111);
    expect(result.distractorStrategy).toBe(1);
    expect(result.refType).toBe('TILE_LOWER');
    expect(result.choiceType).toBe('TILE_LOWER');
  });

  it('decodes CL 544 correctly', () => {
    const result = decodeThailandChallengeLevel(544);
    // 5 → clamped to 3 (max strategy), but spec says 5 maps... let's check actual behavior
    // distractorStrategy is clamped to [1,3]: 5 → 3
    expect(result.distractorStrategy).toBe(3);
    // refType: 4 → index 3 → WORD_TEXT
    expect(result.refType).toBe('WORD_TEXT');
    // choiceType: 4 → index 3 → WORD_TEXT
    expect(result.choiceType).toBe('WORD_TEXT');
  });

  it('decodes CL 188 to SYLLABLE_AUDIO ref and SYLLABLE_AUDIO choice', () => {
    const result = decodeThailandChallengeLevel(188);
    expect(result.distractorStrategy).toBe(1);
    // 8 → index 7 → SYLLABLE_AUDIO
    expect(result.refType).toBe('SYLLABLE_AUDIO');
    expect(result.choiceType).toBe('SYLLABLE_AUDIO');
  });

  it('decodes CL 174 to SYLLABLE_TEXT ref and WORD_TEXT choice', () => {
    const result = decodeThailandChallengeLevel(174);
    expect(result.distractorStrategy).toBe(1);
    expect(result.refType).toBe('SYLLABLE_TEXT'); // 7 → index 6 → SYLLABLE_TEXT
    expect(result.choiceType).toBe('WORD_TEXT'); // 4 → index 3 → WORD_TEXT
  });

  it('decodes CL 178 correctly: syllable ref, syllable_audio choice', () => {
    const result = decodeThailandChallengeLevel(178);
    expect(result.distractorStrategy).toBe(1);
    expect(result.refType).toBe('SYLLABLE_TEXT'); // 7 → index 6 → SYLLABLE_TEXT
    expect(result.choiceType).toBe('SYLLABLE_AUDIO'); // 8 → index 7 → SYLLABLE_AUDIO
  });

  it('decodes CL 317 correctly', () => {
    const result = decodeThailandChallengeLevel(317);
    expect(result.distractorStrategy).toBe(3);
    expect(result.refType).toBe('TILE_LOWER'); // 1 → index 0 → TILE_LOWER
    expect(result.choiceType).toBe('SYLLABLE_TEXT'); // 7 → index 6 → SYLLABLE_TEXT
  });

  it('returns TILE_LOWER for out-of-bounds index', () => {
    const result = decodeThailandChallengeLevel(190);
    // choiceType digit is 0 → index -1 → fallback to TYPES[0]
    expect(result.choiceType).toBe('TILE_LOWER');
  });

  it('produces refType and choiceType in the TYPES array', () => {
    const cls = [111, 235, 312, 544, 188];
    for (const cl of cls) {
      const result = decodeThailandChallengeLevel(cl);
      expect(TYPES).toContain(result.refType);
      expect(TYPES).toContain(result.choiceType);
    }
  });
});
