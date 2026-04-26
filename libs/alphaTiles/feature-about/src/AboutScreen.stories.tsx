import type { Meta, StoryObj } from '@storybook/react';
import { AboutScreen } from './AboutScreen';

const meta: Meta<typeof AboutScreen> = {
  title: 'alphaTiles/feature-about/AboutScreen',
  component: AboutScreen,
  args: {
    onBack: () => undefined,
    versionLabel: 'Version 1.2.3',
    localName: 'AlphaTiles',
    langPlusCountry: 'English (United States)',
    creditsHeading: 'Credits',
    credits:
      'Designed and built by the AlphaTiles team in collaboration with the language community.',
    showSecondaryCredits: false,
    secondaryCredits: '',
    showEmail: true,
    emailLabel: 'contact@alphatilesapps.org',
    showPrivacy: true,
    privacyLabel: 'Privacy Policy',
    onEmailTap: () => undefined,
    onPrivacyTap: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof AboutScreen>;

export const Default: Story = {};

export const WithSecondaryCredits: Story = {
  args: {
    showSecondaryCredits: true,
    secondaryCredits:
      'Audio recordings courtesy of the regional literacy programme. Tile illustrations by community contributors.',
  },
};

export const NoOptionalLinks: Story = {
  args: {
    showEmail: false,
    showPrivacy: false,
  },
};
