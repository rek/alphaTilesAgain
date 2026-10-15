import { createPlayerPool } from './createPlayerPool';

function makePlayer(source: number) {
  return { source, remove: jest.fn() } as never as ReturnType<
    Parameters<typeof createPlayerPool>[0]['create']
  > & { source: number; remove: jest.Mock };
}

function setup(capacity: number) {
  const created: Array<ReturnType<typeof makePlayer>> = [];
  const pool = createPlayerPool({
    capacity,
    create: (source) => {
      const p = makePlayer(source);
      created.push(p);
      return p;
    },
  });
  return { pool, created };
}

describe('createPlayerPool', () => {
  it('creates a player on first acquire and reuses it after', () => {
    const { pool, created } = setup(2);
    const a1 = pool.acquire('tile:a', 10);
    const a2 = pool.acquire('tile:a', 10);
    expect(a1).toBe(a2);
    expect(created).toHaveLength(1);
  });

  it('never holds more than capacity live players', () => {
    const { pool } = setup(3);
    for (let i = 0; i < 10; i++) pool.acquire(`k${i}`, i);
    expect(pool.size).toBe(3);
  });

  it('evicts and removes the least-recently-used player', () => {
    const { pool, created } = setup(2);
    pool.acquire('a', 1);
    pool.acquire('b', 2);
    pool.acquire('a', 1); // a is now most recent
    pool.acquire('c', 3); // evicts b
    expect(pool.has('a')).toBe(true);
    expect(pool.has('b')).toBe(false);
    expect(created[1].remove).toHaveBeenCalledTimes(1);
    expect(created[0].remove).not.toHaveBeenCalled();
  });

  it('re-creates an evicted clip from its source on next acquire', () => {
    const { pool, created } = setup(1);
    pool.acquire('a', 1);
    pool.acquire('b', 2);
    const again = pool.acquire('a', 1) as unknown as { source: number };
    expect(again.source).toBe(1);
    expect(created).toHaveLength(3);
  });

  it('adopt counts toward capacity and evicts', () => {
    const { pool } = setup(1);
    const first = makePlayer(1);
    pool.adopt('a', first);
    pool.adopt('b', makePlayer(2));
    expect(pool.size).toBe(1);
    expect(first.remove).toHaveBeenCalled();
  });

  it('keeps every player with Infinity capacity (web)', () => {
    const { pool } = setup(Infinity);
    for (let i = 0; i < 50; i++) pool.acquire(`k${i}`, i);
    expect(pool.size).toBe(50);
    expect(pool.liveHandles()).toHaveLength(50);
  });

  it('survives a player whose remove() throws', () => {
    const { pool } = setup(1);
    const bad = makePlayer(1);
    bad.remove.mockImplementation(() => {
      throw new Error('boom');
    });
    pool.adopt('a', bad);
    expect(() => pool.acquire('b', 2)).not.toThrow();
  });
});
