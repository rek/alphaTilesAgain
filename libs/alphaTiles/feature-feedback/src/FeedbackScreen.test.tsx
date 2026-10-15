import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FeedbackScreen } from './FeedbackScreen';

function props(overrides: Partial<Parameters<typeof FeedbackScreen>[0]> = {}) {
  return {
    title: 'Feedback',
    backLabel: 'Back',
    onBack: jest.fn(),
    intro: 'Tell us',
    buttonLabel: 'Send by email',
    onSend: jest.fn(),
    email: 'hello@lead-m.hk',
    addressLabel: 'Our address',
    mailFailed: false,
    noMailAppMessage: 'No mail app found',
    ...overrides,
  };
}

describe('FeedbackScreen', () => {
  it('shows the address and sends on tap', () => {
    const p = props();
    const { getByText } = render(<FeedbackScreen {...p} />);
    expect(getByText('hello@lead-m.hk')).toBeTruthy();
    fireEvent.press(getByText('Send by email'));
    expect(p.onSend).toHaveBeenCalledTimes(1);
  });

  it('shows the no-mail-app message only after mail fails', () => {
    const { queryByText, rerender } = render(<FeedbackScreen {...props()} />);
    expect(queryByText('No mail app found')).toBeNull();
    rerender(<FeedbackScreen {...props({ mailFailed: true })} />);
    expect(queryByText('No mail app found')).toBeTruthy();
  });

  it('back calls onBack', () => {
    const p = props();
    const { getByLabelText } = render(<FeedbackScreen {...p} />);
    fireEvent.press(getByLabelText('Back'));
    expect(p.onBack).toHaveBeenCalled();
  });
});
