/**
 * Whether the root-layout web audio gate must block the current route.
 *
 * The index route ('/') runs LoadingContainer, which has its own in-flow
 * "Tap to begin" step (bootSequence 'web-gate' phase), so the root gate stays
 * out of its way. Any other route reached before unlock — a reload or deep
 * link straight to /menu or /games/… — gets gated, otherwise its first audio
 * would be blocked by the browser autoplay policy (#47).
 */
export function shouldGateRoute({
  isAudioUnlocked,
  pathname,
}: {
  isAudioUnlocked: boolean;
  pathname: string;
}) {
  if (isAudioUnlocked) return false;
  return pathname !== '/' && pathname !== '';
}
