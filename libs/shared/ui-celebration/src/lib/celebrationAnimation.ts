/**
 * Bundled celebration Lottie (Bodymovin 5.7 JSON as a JS object), authored
 * in-house for AlphaTiles — no third-party asset, no network fetch (M7).
 * Licence: same as this repo.
 *
 * 400×400 @ 30fps, 90 frames, played once:
 *   - a gold star pops in (scale overshoot) and spins a quarter turn,
 *   - a ring bursts outward and fades,
 *   - 16 confetti pieces fly out radially, tumble and fade.
 *
 * Built from small helpers so the geometry stays readable; the exported
 * value is plain data that `LottieView` accepts as `source` on native and web.
 */

const SIZE = 400;
const CENTER = SIZE / 2;
const FRAMES = 90;
const CONFETTI_COUNT = 16;

const PALETTE: Array<[number, number, number]> = [
  [0.898, 0.224, 0.208], // red
  [0.263, 0.627, 0.278], // green
  [0.082, 0.396, 0.753], // blue
  [0.984, 0.549, 0.0], // orange
  [0.557, 0.141, 0.667], // purple
  [1.0, 0.792, 0.157], // gold
];

const EASE_OUT = { i: { x: [0.2], y: [1] }, o: { x: [0.4], y: [0] } };

function still(k: number | number[]) {
  return { a: 0, k };
}

/** Animated property from [frame, value] pairs (values wrapped as arrays). */
function anim(frames: Array<[number, number[]]>) {
  return {
    a: 1,
    k: frames.map(([t, s], idx) => {
      if (idx === frames.length - 1) return { t, s };
      const dims = s.length;
      return {
        t,
        s,
        i: { x: Array(dims).fill(EASE_OUT.i.x[0]), y: Array(dims).fill(1) },
        o: { x: Array(dims).fill(EASE_OUT.o.x[0]), y: Array(dims).fill(0) },
      };
    }),
  };
}

function rgba([r, g, b]: [number, number, number]) {
  return still([r, g, b, 1]);
}

function groupTransform() {
  return {
    ty: 'tr',
    p: still([0, 0]),
    a: still([0, 0]),
    s: still([100, 100]),
    r: still(0),
    o: still(100),
    sk: still(0),
    sa: still(0),
  };
}

function layer({
  ind,
  nm,
  ks,
  shapes,
  ip = 0,
}: {
  ind: number;
  nm: string;
  ks: Record<string, unknown>;
  shapes: unknown[];
  ip?: number;
}) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm,
    sr: 1,
    ks: { a: still([0, 0, 0]), ...ks },
    ao: 0,
    shapes,
    ip,
    op: FRAMES,
    st: 0,
    bm: 0,
  };
}

function starLayer(ind: number) {
  return layer({
    ind,
    nm: 'star',
    ks: {
      o: still(100),
      p: still([CENTER, CENTER, 0]),
      r: anim([
        [0, [-45]],
        [24, [0]],
      ]),
      s: anim([
        [0, [0, 0, 100]],
        [14, [125, 125, 100]],
        [24, [100, 100, 100]],
      ]),
    },
    shapes: [
      {
        ty: 'gr',
        nm: 'star',
        it: [
          {
            ty: 'sr',
            sy: 1,
            d: 1,
            pt: still(5),
            p: still([0, 0]),
            r: still(0),
            ir: still(34),
            is: still(0),
            or: still(78),
            os: still(0),
          },
          { ty: 'fl', c: rgba(PALETTE[5]), o: still(100), r: 1 },
          {
            ty: 'st',
            c: rgba([0.902, 0.588, 0.0]),
            o: still(100),
            w: still(6),
            lc: 2,
            lj: 2,
          },
          groupTransform(),
        ],
      },
    ],
  });
}

function ringLayer(ind: number) {
  return layer({
    ind,
    nm: 'ring',
    ks: {
      o: anim([
        [4, [100]],
        [36, [0]],
      ]),
      p: still([CENTER, CENTER, 0]),
      r: still(0),
      s: anim([
        [4, [20, 20, 100]],
        [36, [260, 260, 100]],
      ]),
    },
    shapes: [
      {
        ty: 'gr',
        nm: 'ring',
        it: [
          { ty: 'el', d: 1, s: still([120, 120]), p: still([0, 0]) },
          {
            ty: 'st',
            c: rgba(PALETTE[2]),
            o: still(100),
            w: still(5),
            lc: 2,
            lj: 2,
          },
          groupTransform(),
        ],
      },
    ],
  });
}

function confettiLayer(ind: number, i: number) {
  const angle = (i / CONFETTI_COUNT) * Math.PI * 2;
  // Alternate near/far so the burst doesn't read as a perfect circle.
  const radius = i % 2 === 0 ? 175 : 130;
  const start = 6 + (i % 4);
  const end = Math.min(FRAMES - 10, start + 40 + (i % 3) * 6);
  const x = Math.round(CENTER + Math.cos(angle) * radius);
  // Slight gravity: pieces settle a bit lower than their launch line.
  const y = Math.round(CENTER + Math.sin(angle) * radius + 40);
  const isCircle = i % 3 === 0;
  const color = PALETTE[i % PALETTE.length];
  const spin = (i % 2 === 0 ? 1 : -1) * (270 + (i % 5) * 45);

  return layer({
    ind,
    nm: `confetti-${i}`,
    ip: start,
    ks: {
      o: anim([
        [end - 12, [100]],
        [FRAMES - 4, [0]],
      ]),
      p: anim([
        [start, [CENTER, CENTER, 0]],
        [end, [x, y, 0]],
      ]),
      r: anim([
        [start, [0]],
        [FRAMES, [spin]],
      ]),
      s: anim([
        [start, [40, 40, 100]],
        [start + 8, [100, 100, 100]],
      ]),
    },
    shapes: [
      {
        ty: 'gr',
        nm: 'piece',
        it: [
          isCircle
            ? { ty: 'el', d: 1, s: still([16, 16]), p: still([0, 0]) }
            : {
                ty: 'rc',
                d: 1,
                s: still([12, 24]),
                p: still([0, 0]),
                r: still(3),
              },
          { ty: 'fl', c: rgba(color), o: still(100), r: 1 },
          groupTransform(),
        ],
      },
    ],
  });
}

// Layer order: first = top. Star above ring above confetti.
const layers = [
  starLayer(1),
  ringLayer(2),
  ...Array.from({ length: CONFETTI_COUNT }, (_, i) => confettiLayer(3 + i, i)),
];

export const celebrationAnimation = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: FRAMES,
  w: SIZE,
  h: SIZE,
  nm: 'alphatiles-celebration',
  ddd: 0,
  assets: [],
  layers,
  markers: [],
};
