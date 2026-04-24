import { buildDoors } from '../useDoors';

function makeGame(i: number) {
  return {
    door: i + 1,
    country: `Country${i}`,
    challengeLevel: 1,
    color: '0',
    instructionAudio: '',
    audioDuration: '',
    syllOrTile: 'T' as const,
    stagesIncluded: '-',
  };
}

const baseOpts = {
  colorsHex: ['#FF0000'],
  trackerCounts: {},
  playerId: null,
  page: 0,
};

describe('buildDoors', () => {
  it('empty game list → totalPages=1, pageDoors=[]', () => {
    const result = buildDoors({ ...baseOpts, gameRows: [], doorsPerPageSetting: 20 });
    expect(result.totalPages).toBe(1);
    expect(result.pageDoors).toHaveLength(0);
  });

  it('20 games, doorsPerPage=20 → totalPages=1, all doors on page 0', () => {
    const result = buildDoors({
      ...baseOpts,
      gameRows: Array.from({ length: 20 }, (_, i) => makeGame(i)),
      doorsPerPageSetting: 20,
    });
    expect(result.totalPages).toBe(1);
    expect(result.pageDoors).toHaveLength(20);
  });

  it('21 games, doorsPerPage=20 → totalPages=2, page 0 has 20', () => {
    const result = buildDoors({
      ...baseOpts,
      gameRows: Array.from({ length: 21 }, (_, i) => makeGame(i)),
      doorsPerPageSetting: 20,
    });
    expect(result.totalPages).toBe(2);
    expect(result.pageDoors).toHaveLength(20);
  });

  it('page clamped when page > totalPages-1', () => {
    const result = buildDoors({
      ...baseOpts,
      gameRows: Array.from({ length: 21 }, (_, i) => makeGame(i)),
      doorsPerPageSetting: 20,
      page: 99,
    });
    expect(result.pageDoors).toHaveLength(1);
  });

  it('doorsPerPage clamped to MIN=6 when setting < 6', () => {
    const result = buildDoors({
      ...baseOpts,
      gameRows: Array.from({ length: 10 }, (_, i) => makeGame(i)),
      doorsPerPageSetting: 2,
    });
    expect(result.doorsPerPage).toBe(6);
  });

  it('doorsPerPage clamped to MAX=40 when setting > 40', () => {
    const result = buildDoors({
      ...baseOpts,
      gameRows: Array.from({ length: 50 }, (_, i) => makeGame(i)),
      doorsPerPageSetting: 100,
    });
    expect(result.doorsPerPage).toBe(40);
  });

  it('noRightWrong countries get in-process visual and black textColorHex', () => {
    const result = buildDoors({
      ...baseOpts,
      gameRows: [{ ...makeGame(0), country: 'Romania' }],
      doorsPerPageSetting: 20,
    });
    expect(result.pageDoors[0].visual).toBe('in-process');
    expect(result.pageDoors[0].textColorHex).toBe('#000000');
  });
});
