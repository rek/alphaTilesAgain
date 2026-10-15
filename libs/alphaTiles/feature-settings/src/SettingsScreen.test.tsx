import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SettingsScreen } from './SettingsScreen';

function props(overrides: Partial<Parameters<typeof SettingsScreen>[0]> = {}) {
  return {
    title: 'Settings',
    backLabel: 'Back',
    onBack: jest.fn(),
    showGameNames: true,
    showGameNamesLabel: 'Show game names on doors',
    showGameNamesHint: 'Turn off for colour-only doors',
    onShowGameNamesChange: jest.fn(),
    showFeedback: true,
    feedbackLabel: 'Send feedback',
    feedbackHint: 'Email us',
    onFeedback: jest.fn(),
    ...overrides,
  };
}

describe('SettingsScreen', () => {
  it('renders the game-names toggle with its current value', () => {
    const { getByText, getByTestId } = render(<SettingsScreen {...props()} />);
    expect(getByText('Show game names on doors')).toBeTruthy();
    expect(getByTestId('toggle-show-game-names', { includeHiddenElements: true }).props.value).toBe(true);
  });

  it('switching reports the new value', () => {
    const p = props();
    const { getByTestId } = render(<SettingsScreen {...p} />);
    fireEvent(getByTestId('toggle-show-game-names', { includeHiddenElements: true }), 'valueChange', false);
    expect(p.onShowGameNamesChange).toHaveBeenCalledWith(false);
  });

  it('tapping the row flips the value (big target)', () => {
    const p = props({ showGameNames: false });
    const { getByRole } = render(<SettingsScreen {...p} />);
    fireEvent.press(getByRole('switch'));
    expect(p.onShowGameNamesChange).toHaveBeenCalledWith(true);
  });

  it('feedback row shows and opens feedback when enabled', () => {
    const p = props();
    const { getByText } = render(<SettingsScreen {...p} />);
    fireEvent.press(getByText('Send feedback'));
    expect(p.onFeedback).toHaveBeenCalledTimes(1);
  });

  it('feedback row hidden when showFeedback is false', () => {
    const { queryByText } = render(<SettingsScreen {...props({ showFeedback: false })} />);
    expect(queryByText('Send feedback')).toBeNull();
  });

  it('back button calls onBack', () => {
    const p = props();
    const { getByLabelText } = render(<SettingsScreen {...p} />);
    fireEvent.press(getByLabelText('Back'));
    expect(p.onBack).toHaveBeenCalled();
  });
});
