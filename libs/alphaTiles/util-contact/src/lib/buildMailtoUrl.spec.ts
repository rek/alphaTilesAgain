import { buildFeedbackSubject } from './buildFeedbackSubject';
import { buildMailtoUrl } from './buildMailtoUrl';

describe('buildMailtoUrl', () => {
  it('encodes subject and body', () => {
    expect(
      buildMailtoUrl({ email: 'a@b.hk', subject: 'Hi & bye', body: 'line1\nline2' }),
    ).toBe('mailto:a@b.hk?subject=Hi%20%26%20bye&body=line1%0Aline2');
  });

  it('round-trips non-latin text', () => {
    const url = buildMailtoUrl({ email: 'a@b.hk', subject: '學廣話 意見', body: '' });
    expect(decodeURIComponent(url.split('subject=')[1].split('&')[0])).toBe('學廣話 意見');
  });
});

describe('buildFeedbackSubject', () => {
  it('carries app, language, version, platform', () => {
    expect(
      buildFeedbackSubject({
        appName: '學廣話',
        feedbackLabel: 'Feedback',
        language: 'Cantonese',
        version: '1.2.3',
        platform: 'android',
      }),
    ).toBe('學廣話 Feedback | Cantonese | v1.2.3 | android');
  });
});
