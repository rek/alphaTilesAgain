import { checkSettingsTypes } from '../checkSettingsTypes';
import { mkParsed } from '../../__tests__/testHelpers';

describe('checkSettingsTypes', () => {
  it('no issues on empty settings', () => {
    const parsed = mkParsed({ settingsEntries: [] });
    expect(checkSettingsTypes(parsed)).toHaveLength(0);
  });

  it('no issues on valid boolean setting', () => {
    const parsed = mkParsed({
      settingsEntries: [{ label: 'Has tile audio', value: 'true' }],
    });
    expect(checkSettingsTypes(parsed)).toHaveLength(0);
  });

  it('flags invalid boolean setting', () => {
    const parsed = mkParsed({
      settingsEntries: [{ label: 'Has tile audio', value: 'yes' }],
    });
    const issues = checkSettingsTypes(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'INVALID_BOOLEAN_SETTING',
      severity: 'error',
    }));
  });

  it('no issues on valid int setting', () => {
    const parsed = mkParsed({
      settingsEntries: [{ label: 'After 12 checked trackers', value: '12' }],
    });
    expect(checkSettingsTypes(parsed)).toHaveLength(0);
  });

  it('flags invalid int setting', () => {
    const parsed = mkParsed({
      settingsEntries: [{ label: 'After 12 checked trackers', value: 'notanint' }],
    });
    const issues = checkSettingsTypes(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'INVALID_INT_SETTING',
      severity: 'error',
    }));
  });

  it('flags SCR out of [0,1] range', () => {
    const parsed = mkParsed({
      settingsEntries: [{ label: 'Stage correspondence ratio', value: '1.5' }],
    });
    const issues = checkSettingsTypes(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'RATIO_OUT_OF_RANGE',
      severity: 'error',
    }));
  });

  it('flags SCR of 1 as crash risk', () => {
    const parsed = mkParsed({
      settingsEntries: [{ label: 'Stage correspondence ratio', value: '1' }],
    });
    const issues = checkSettingsTypes(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'STAGE_CORRESPONDENCE_RATIO_IS_ONE',
    }));
  });

  it('emits info for unknown setting key', () => {
    const parsed = mkParsed({
      settingsEntries: [{ label: 'Some Unknown Setting', value: 'anything' }],
    });
    const issues = checkSettingsTypes(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'UNKNOWN_SETTING_KEY',
      severity: 'info',
    }));
  });
});
