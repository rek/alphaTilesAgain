/**
 * Unit tests for ShareScreen (pure presenter).
 *
 * QR code library mocked — tests verify render tree, not SVG internals.
 * Covers: valid URL, missing URL, share button tap.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ShareScreen } from './ShareScreen';

// Mock QRCode — react-native-qrcode-svg pulls in react-native-svg which needs
// a native module in test environment.
jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ value }: { value: string }) =>
      React.createElement(View, { testID: 'qr-code' }, React.createElement(Text, null, value)),
  };
});

const BASE_PROPS = {
  available: true,
  url: 'https://play.google.com/store/apps/details?id=org.alphatilesapps.alphatiles.blue.engEnglish4',
  instructions: 'Scan this QR code to share this app',
  shareButtonLabel: 'Share via...',
  qrAltLabel: 'QR code linking to the Play Store',
  unavailableMessage: 'Sharing not configured for this pack',
  onShareTap: jest.fn(),
};

describe('ShareScreen', () => {
  it('renders QR code with the correct URL when available', () => {
    const { getByTestId, getByText } = render(<ShareScreen {...BASE_PROPS} />);
    expect(getByTestId('qr-code')).toBeTruthy();
    expect(getByText(BASE_PROPS.url)).toBeTruthy();
  });

  it('renders share button when available', () => {
    const { getByText } = render(<ShareScreen {...BASE_PROPS} />);
    expect(getByText('Share via...')).toBeTruthy();
  });

  it('hides QR code and share button when not available', () => {
    const { queryByTestId, queryByText, getByText } = render(
      <ShareScreen {...BASE_PROPS} available={false} url="" />,
    );
    expect(queryByTestId('qr-code')).toBeNull();
    expect(queryByText('Share via...')).toBeNull();
    expect(getByText('Sharing not configured for this pack')).toBeTruthy();
  });

  it('calls onShareTap when share button is pressed', () => {
    const onShareTap = jest.fn();
    const { getByText } = render(
      <ShareScreen {...BASE_PROPS} onShareTap={onShareTap} />,
    );
    fireEvent.press(getByText('Share via...'));
    expect(onShareTap).toHaveBeenCalledTimes(1);
  });
});
