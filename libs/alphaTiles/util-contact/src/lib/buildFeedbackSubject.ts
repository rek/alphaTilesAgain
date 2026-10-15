/** Mail subject carrying the context a maintainer needs to triage. */
export function buildFeedbackSubject({
  appName,
  feedbackLabel,
  language,
  version,
  platform,
}: {
  appName: string;
  feedbackLabel: string;
  language: string;
  version: string;
  platform: string;
}) {
  return `${appName} ${feedbackLabel} | ${language} | v${version} | ${platform}`;
}
