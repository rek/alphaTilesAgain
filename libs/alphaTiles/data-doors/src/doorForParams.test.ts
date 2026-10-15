import { doorForParams } from './internal/doorForParams';

const doors = [
  { index: 1, enabled: true },
  { index: 2, enabled: true },
  { index: 3, enabled: false }, // e.g. Taiwan with "Enable stroke order game" FALSE
];

describe('doorForParams (useDoor)', () => {
  it('resolves doorIndex', () => {
    expect(doorForParams(doors, { doorIndex: '2' })?.index).toBe(2);
  });

  it('doorIndex wins over the legacy gameNumber alias', () => {
    expect(doorForParams(doors, { doorIndex: '2', gameNumber: '1' })?.index).toBe(2);
  });

  it('falls back to gameNumber when doorIndex is absent', () => {
    expect(doorForParams(doors, { gameNumber: '2' })?.index).toBe(2);
  });

  it('takes the first value of an array param', () => {
    expect(doorForParams(doors, { doorIndex: ['2', '1'] })?.index).toBe(2);
  });

  it('missing params → door 1', () => {
    expect(doorForParams(doors, {})?.index).toBe(1);
  });

  it('unknown index → undefined', () => {
    expect(doorForParams(doors, { doorIndex: '99' })).toBeUndefined();
    expect(doorForParams(doors, { doorIndex: 'abc' })).toBeUndefined();
  });

  it('hidden door → undefined (deep link cannot open it)', () => {
    expect(doorForParams(doors, { doorIndex: '3' })).toBeUndefined();
  });
});
