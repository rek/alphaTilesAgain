/**
 * Unit tests for AboutScreen (pure presenter).
 *
 * Tests cover the fallback matrix from design.md §D7:
 * - Full pack (all optional fields present)
 * - Missing email → email surface hidden
 * - Privacy URL is "none" → privacy surface hidden
 * - Same-name pack → langPlusCountry has single name form
 *
 * Presenter tests: no providers required.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AboutScreen } from './AboutScreen';

const BASE_PROPS = {
  versionLabel: 'Version 1.0.0',
  localName: 'English',
  langPlusCountry: 'English / English (USA)',
  creditsHeading: 'Credits',
  credits: 'Some credits text here',
  showSecondaryCredits: false,
  secondaryCredits: '',
  showEmail: true,
  emailLabel: 'Email us',
  showPrivacy: true,
  privacyLabel: 'Privacy Policy',
  onEmailTap: jest.fn(),
  onPrivacyTap: jest.fn(),
};

describe('AboutScreen', () => {
  it('renders all surfaces when all optional fields are present (full pack)', () => {
    const { getByText } = render(
      <AboutScreen
        {...BASE_PROPS}
        showSecondaryCredits
        secondaryCredits="Secondary credits"
      />,
    );
    expect(getByText('Version 1.0.0')).toBeTruthy();
    expect(getByText('English')).toBeTruthy();
    expect(getByText('Some credits text here')).toBeTruthy();
    expect(getByText('Secondary credits')).toBeTruthy();
    expect(getByText('Email us')).toBeTruthy();
    expect(getByText('Privacy Policy')).toBeTruthy();
  });

  it('hides email link when showEmail is false', () => {
    const { queryByText } = render(
      <AboutScreen {...BASE_PROPS} showEmail={false} />,
    );
    expect(queryByText('Email us')).toBeNull();
  });

  it('hides privacy link when showPrivacy is false', () => {
    const { queryByText } = render(
      <AboutScreen {...BASE_PROPS} showPrivacy={false} />,
    );
    expect(queryByText('Privacy Policy')).toBeNull();
  });

  it('hides secondary credits when showSecondaryCredits is false', () => {
    const { queryByText } = render(
      <AboutScreen
        {...BASE_PROPS}
        showSecondaryCredits={false}
        secondaryCredits="Should not appear"
      />,
    );
    expect(queryByText('Should not appear')).toBeNull();
  });

  it('calls onEmailTap when email link is pressed', () => {
    const onEmailTap = jest.fn();
    const { getByText } = render(
      <AboutScreen {...BASE_PROPS} onEmailTap={onEmailTap} />,
    );
    fireEvent.press(getByText('Email us'));
    expect(onEmailTap).toHaveBeenCalledTimes(1);
  });

  it('calls onPrivacyTap when privacy link is pressed', () => {
    const onPrivacyTap = jest.fn();
    const { getByText } = render(
      <AboutScreen {...BASE_PROPS} onPrivacyTap={onPrivacyTap} />,
    );
    fireEvent.press(getByText('Privacy Policy'));
    expect(onPrivacyTap).toHaveBeenCalledTimes(1);
  });

  it('renders single-name form when langPlusCountry has same-name format', () => {
    const { getByText } = render(
      <AboutScreen
        {...BASE_PROPS}
        langPlusCountry="English (USA)"
      />,
    );
    expect(getByText('English (USA)')).toBeTruthy();
  });
});
