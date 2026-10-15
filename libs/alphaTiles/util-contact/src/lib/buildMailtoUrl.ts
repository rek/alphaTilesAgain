/** `mailto:` URL with percent-encoded subject/body (spaces as %20, not +). */
export function buildMailtoUrl({
  email,
  subject,
  body,
}: {
  email: string;
  subject: string;
  body: string;
}) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
