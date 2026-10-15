import { contactEmailOf } from './contactEmailOf';

describe('contactEmailOf', () => {
  it.each([undefined, '', '  ', 'none', 'None'])('absent %p -> undefined', (email) => {
    expect(contactEmailOf({ email })).toBeUndefined();
  });

  it.each(['yue@example.com', 'a@example.org', 'a@EXAMPLE.NET', 'a@foo.example'])(
    'placeholder %s -> undefined',
    (email) => {
      expect(contactEmailOf({ email })).toBeUndefined();
    },
  );

  it('real address passes through (trimmed)', () => {
    expect(contactEmailOf({ email: ' hello@lead-m.hk ' })).toBe('hello@lead-m.hk');
  });

  it('example-like but real domain is kept', () => {
    expect(contactEmailOf({ email: 'a@myexample.com' })).toBe('a@myexample.com');
  });
});
