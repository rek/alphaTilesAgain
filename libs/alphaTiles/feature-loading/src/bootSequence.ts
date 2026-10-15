export type Phase =
  | 'fonts'
  | 'i18n'
  | 'audio'
  | 'precompute'
  | 'hydration'
  | 'done';

export type BootSequenceOpts = {
  onPhaseChange: (phase: Phase) => void;
  /** Synchronous — call registerContentNamespaces with derived content inside. */
  registerContent: () => void;
  /** Resolves when AudioProvider has finished loading all handles. */
  awaitAudio: () => Promise<void>;
  /** Async — resolves when players store is hydrated. */
  awaitHydration: () => Promise<void>;
};

export async function bootSequence(opts: BootSequenceOpts): Promise<void> {
  const { onPhaseChange, registerContent, awaitAudio, awaitHydration } = opts;

  // Phase 1: fonts (already loaded by AppShell/useFontsReady before BootGate mounts)
  onPhaseChange('fonts');

  // Phase 2: content namespace registration
  onPhaseChange('i18n');
  registerContent();

  // Phase 3: await audio (AudioProvider loads in parallel; may already be resolved)
  onPhaseChange('audio');
  await awaitAudio();

  // Web tap-to-begin is not a phase: data-audio's AudioGate (root layout)
  // keeps this screen unmounted until the tap (#47).

  // Phase 4: precomputes (already run in loadLangPack — emit phase for UI completeness)
  onPhaseChange('precompute');

  // Phase 5: players store hydration gate
  onPhaseChange('hydration');
  await awaitHydration();

  onPhaseChange('done');
}
