export function pickAudioForChar({
  char,
  syllables,
  audioForChar,
}: {
  char: string;
  syllables: Record<string, number>;
  audioForChar: Record<string, string>;
}) {
  if (syllables[char] !== undefined) return { kind: 'syllable' as const, char };
  const lwc = audioForChar[char];
  if (lwc) return { kind: 'word' as const, lwc };
  return { kind: 'none' as const };
}
