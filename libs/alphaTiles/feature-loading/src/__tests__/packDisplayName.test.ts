import { packDisplayName } from '../packDisplayName';

const info = (rows: Record<string, string>) => ({ find: (label: string) => rows[label] });

describe('packDisplayName', () => {
  it('yue: the pack language name', () => {
    expect(
      packDisplayName(info({ 'Ethnologue code': 'yue', 'Lang Name (In Local Lang)': '廣東話', 'Game Name (In Local Lang)': '學廣話' })),
    ).toBe('廣東話');
  });

  it('eng: AlphaTiles brand', () => {
    expect(packDisplayName(info({ 'Ethnologue code': 'eng', 'Lang Name (In Local Lang)': 'English' }))).toBe('AlphaTiles');
  });

  it('falls back to game name, then brand', () => {
    expect(packDisplayName(info({ 'Game Name (In Local Lang)': 'Xx' }))).toBe('Xx');
    expect(packDisplayName(info({}))).toBe('AlphaTiles');
  });
});
