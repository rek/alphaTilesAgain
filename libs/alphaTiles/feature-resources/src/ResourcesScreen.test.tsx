/**
 * Unit tests for ResourcesScreen (pure presenter).
 *
 * Covers: empty state, non-empty list, link tap.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ResourcesScreen } from './ResourcesScreen';

const SAMPLE_RESOURCES = [
  { name: 'Alpha Tiles: Ready to Read', link: 'https://play.google.com/store/apps/details?id=org.alphatilesapps.alphatiles.blue.engEnglish4', image: 'zz_playstore_rp' },
  { name: 'SIL Website', link: 'https://sil.org', image: '' },
  { name: 'Learn More', link: 'https://example.com', image: '' },
];

describe('ResourcesScreen', () => {
  it('renders empty-state message when resources list is empty', () => {
    const { getByText } = render(
      <ResourcesScreen
        isEmpty
        resources={[]}
        emptyMessage="No resources available"
        onResourceTap={jest.fn()}
      />,
    );
    expect(getByText('No resources available')).toBeTruthy();
  });

  it('renders all resource entries when list is non-empty', () => {
    const { getByText } = render(
      <ResourcesScreen
        isEmpty={false}
        resources={SAMPLE_RESOURCES}
        emptyMessage="No resources available"
        onResourceTap={jest.fn()}
      />,
    );
    expect(getByText('Alpha Tiles: Ready to Read')).toBeTruthy();
    expect(getByText('SIL Website')).toBeTruthy();
    expect(getByText('Learn More')).toBeTruthy();
  });

  it('renders entries in order of appearance', () => {
    const { getAllByRole } = render(
      <ResourcesScreen
        isEmpty={false}
        resources={SAMPLE_RESOURCES}
        emptyMessage="No resources available"
        onResourceTap={jest.fn()}
      />,
    );
    const links = getAllByRole('link');
    expect(links).toHaveLength(3);
    // Verify order by accessibility label
    expect(links[0].props.accessibilityLabel).toBe('Alpha Tiles: Ready to Read');
    expect(links[1].props.accessibilityLabel).toBe('SIL Website');
    expect(links[2].props.accessibilityLabel).toBe('Learn More');
  });

  it('calls onResourceTap with correct URL when entry is pressed', () => {
    const onResourceTap = jest.fn();
    const { getByText } = render(
      <ResourcesScreen
        isEmpty={false}
        resources={SAMPLE_RESOURCES}
        emptyMessage="No resources available"
        onResourceTap={onResourceTap}
      />,
    );
    fireEvent.press(getByText('SIL Website'));
    expect(onResourceTap).toHaveBeenCalledWith('https://sil.org');
  });

  it('does not render list when isEmpty is true', () => {
    const { queryByText } = render(
      <ResourcesScreen
        isEmpty
        resources={SAMPLE_RESOURCES}
        emptyMessage="No resources available"
        onResourceTap={jest.fn()}
      />,
    );
    // List entries should not appear even though resources prop has data
    expect(queryByText('Alpha Tiles: Ready to Read')).toBeNull();
    expect(queryByText('No resources available')).toBeTruthy();
  });
});
