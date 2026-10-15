import { celebrationAnimation } from './celebrationAnimation';

type Keyframe = { t: number; s: number[] };
type Prop = { a: number; k: unknown };

function animatedProps(node: unknown, out: Prop[] = []): Prop[] {
  if (Array.isArray(node)) {
    node.forEach((n) => animatedProps(n, out));
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (obj['a'] === 1 && Array.isArray(obj['k'])) out.push(obj as Prop);
    Object.values(obj).forEach((v) => animatedProps(v, out));
  }
  return out;
}

describe('celebrationAnimation', () => {
  it('is bundled data with no remote references (M7)', () => {
    const json = JSON.stringify(celebrationAnimation);
    expect(json).not.toMatch(/https?:\/\//);
    expect(json).not.toContain('"uri"');
    expect(celebrationAnimation.assets).toEqual([]);
  });

  it('has the Lottie top-level shape LottieView needs', () => {
    expect(celebrationAnimation).toMatchObject({
      v: expect.any(String),
      fr: 30,
      ip: 0,
      op: 90,
      w: 400,
      h: 400,
    });
    expect(celebrationAnimation.layers.length).toBeGreaterThan(2);
  });

  it('gives every layer a unique index inside the timeline', () => {
    const inds = celebrationAnimation.layers.map((l) => l.ind);
    expect(new Set(inds).size).toBe(inds.length);
    for (const l of celebrationAnimation.layers) {
      expect(l.ip).toBeGreaterThanOrEqual(0);
      expect(l.op).toBeLessThanOrEqual(celebrationAnimation.op);
      expect(l.ip).toBeLessThan(l.op);
    }
  });

  it('keeps keyframes ordered, in range and dimension-consistent', () => {
    const props = animatedProps(celebrationAnimation.layers);
    expect(props.length).toBeGreaterThan(0);
    for (const p of props) {
      const kfs = p.k as Keyframe[];
      expect(kfs.length).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < kfs.length; i++) {
        expect(kfs[i].t).toBeGreaterThanOrEqual(0);
        expect(kfs[i].t).toBeLessThanOrEqual(celebrationAnimation.op);
        expect(kfs[i].s.length).toBe(kfs[0].s.length);
        if (i > 0) expect(kfs[i].t).toBeGreaterThan(kfs[i - 1].t);
      }
    }
  });
});
