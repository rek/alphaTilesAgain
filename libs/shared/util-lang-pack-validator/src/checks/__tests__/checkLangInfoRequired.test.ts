import { checkLangInfoRequired } from '../checkLangInfoRequired';
import { mkParsed } from '../../__tests__/testHelpers';

const VALID_LANGINFO = [
  { label: 'Lang Name (In Local Lang)', value: 'Test' },
  { label: 'Lang Name (In English)', value: 'Test' },
  { label: 'Ethnologue code', value: 'tst' },
  { label: 'Country', value: 'TestLand' },
  { label: 'Game Name (In Local Lang)', value: 'TestGame' },
  { label: 'Script direction (LTR or RTL)', value: 'LTR' },
  { label: 'The word NAME in local language', value: 'Name' },
  { label: 'Script type', value: 'Roman' },
  { label: 'Email', value: 'test@example.com' },
  { label: 'Privacy Policy', value: 'https://example.com' },
];

describe('checkLangInfoRequired', () => {
  it('no issues on valid langinfo', () => {
    const parsed = mkParsed({ langInfoEntries: VALID_LANGINFO });
    expect(checkLangInfoRequired(parsed)).toHaveLength(0);
  });

  it('flags missing required label', () => {
    const entries = VALID_LANGINFO.filter((e) => e.label !== 'Email');
    const parsed = mkParsed({ langInfoEntries: entries });
    const issues = checkLangInfoRequired(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'MISSING_LANGINFO_LABEL',
      severity: 'error',
      context: expect.objectContaining({ label: 'Email' }),
    }));
  });

  it('flags invalid script direction', () => {
    const entries = VALID_LANGINFO.map((e) =>
      e.label === 'Script direction (LTR or RTL)' ? { ...e, value: 'XTR' } : e,
    );
    const parsed = mkParsed({ langInfoEntries: entries });
    const issues = checkLangInfoRequired(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'INVALID_SCRIPT_DIRECTION',
      severity: 'error',
    }));
  });

  it('flags invalid script type', () => {
    const entries = VALID_LANGINFO.map((e) =>
      e.label === 'Script type' ? { ...e, value: 'Latin' } : e,
    );
    const parsed = mkParsed({ langInfoEntries: entries });
    const issues = checkLangInfoRequired(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'INVALID_SCRIPT_TYPE',
      severity: 'error',
    }));
  });

  it('warns when game name exceeds 30 chars', () => {
    const entries = VALID_LANGINFO.map((e) =>
      e.label === 'Game Name (In Local Lang)'
        ? { ...e, value: 'A very long game name that is over the limit' }
        : e,
    );
    const parsed = mkParsed({ langInfoEntries: entries });
    const issues = checkLangInfoRequired(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'GAME_NAME_TOO_LONG_FOR_PLAY_STORE',
      severity: 'warning',
    }));
  });

  it('flags invalid ethnologue code', () => {
    const entries = VALID_LANGINFO.map((e) =>
      e.label === 'Ethnologue code' ? { ...e, value: 'EN' } : e,
    );
    const parsed = mkParsed({ langInfoEntries: entries });
    const issues = checkLangInfoRequired(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'INVALID_ETHNOLOGUE_CODE',
    }));
  });
});
