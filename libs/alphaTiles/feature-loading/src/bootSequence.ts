export type Phase =
  | 'fonts'
  | 'i18n'
  | 'web-gate'
  | 'audio'
  | 'precompute'
  | 'hydration'
  | 'done';

export type BootSequenceOpts = {
  platform: 'web' | 'native';
  onPhaseChange: (phase: Phase) => void;
  /** Synchronous — call registerContentNamespaces with derived content inside. */
  registerContent: () => void;
  /** Resolves when AudioProvider has finished loading all handles. */
  awaitAudio: () => Promise<void>;
  /** Web only — promise resolves when user taps "Tap to begin". */
  waitForWebGesture?: () => Promise<void>;
  /** Async — resolves when players store is hydrated. */
  awaitHydration: () => Promise<void>;
};

export async function bootSequence(opts: BootSequenceOpts): Promise<void> {
  const { platform, onPhaseChange, registerContent, awaitAudio, waitForWebGesture, awaitHydration } = opts;

  // Phase 1: fonts (already loaded by _layout.tsx/useFontsReady before container mounts)
  onPhaseChange('fonts');

  // Phase 2: content namespace registration
  onPhaseChange('i18n');
  registerContent();

  // Phase 3: web audio gesture gate
  if (platform === 'web' && waitForWebGesture) {
    onPhaseChange('web-gate');
    await waitForWebGesture();
  }

  // Phase 4: await audio (AudioProvider loads in parallel; may already be resolved)
  onPhaseChange('audio');
  await awaitAudio();

  // Phase 5: precomputes (already run in loadLangPack — emit phase for UI completeness)
  onPhaseChange('precompute');

  // Phase 6: players store hydration gate
  onPhaseChange('hydration');
  await awaitHydration();

  onPhaseChange('done');
}
