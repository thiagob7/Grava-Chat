import { writeFileSync } from "node:fs";

const R = 84;
const END = 90;
const rad = (g) => (g * Math.PI) / 180;
const dot = (g, r = R) => [r * Math.cos(rad(g)), r * Math.sin(rad(g))];
const color = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};

const LINEAR = { i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } };
const SUAVE = { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } };

const anima = (frames, ease = SUAVE) => ({
  a: 1,
  k: frames.map((q, i) =>
    i === frames.length - 1 ? { t: q.t, s: [q.v] } : { ...ease, t: q.t, s: [q.v] },
  ),
});
const fixed = (k) => ({ a: 0, k });

const transform = ({ p = [0, 0], o = 100, r = 0 } = {}) => ({
  ty: "tr", p: fixed(p), a: fixed([0, 0]), s: fixed([100, 100]),
  r: typeof r === "object" ? r : fixed(r),
  o: typeof o === "object" ? o : fixed(o),
});

const ellipse = (d) => ({ ty: "el", nm: "circulo", p: fixed([0, 0]), s: fixed([d, d]) });
const stroke = (hex, w, opacity = 100) => ({
  ty: "st", nm: "traco", c: fixed(color(hex)),
  o: typeof opacity === "object" ? opacity : fixed(opacity),
  w: fixed(w), lc: 2, lj: 2,
});
const fills = (hex, opacity = 100) => ({
  ty: "fl", nm: "cheio", c: fixed(color(hex)),
  o: typeof opacity === "object" ? opacity : fixed(opacity),
});
const trim = (start, end) => ({ ty: "tm", nm: "corte", s: fixed(start), e: fixed(end), o: fixed(0), m: 1 });

const layer = (ind, nm, shapes, ks = {}) => ({
  ddd: 0, ind, ty: 4, nm, sr: 1,
  ks: {
    o: ks.o ?? fixed(100),
    r: ks.r ?? fixed(0),
    p: fixed([100, 100, 0]),
    a: fixed([0, 0, 0]),
    s: fixed([100, 100, 100]),
  },
  ao: 0, shapes, ip: 0, op: END, st: 0, bm: 0,
});

const LEFT = 125, A_DIR = 55, A_BASE = 90;
const k = (4 / 3) * Math.tan(rad((A_BASE - A_DIR) / 4)) * R;
const tang = (g, signal) => [signal * -Math.sin(rad(g)) * k, signal * Math.cos(rad(g)) * k];

const neveTop = [
  [-34, 61], [-18, 68], [-2, 59], [14, 66], [30, 60], [42, 67],
];

const neve = {
  closed: true,
  points: [
    { vertex: dot(LEFT), inTan: tang(LEFT, -1), outTan: [7, -5] },
    ...neveTop.map((v) => ({ vertex: v, inTan: [-8, 0], outTan: [8, 0] })),
    { vertex: dot(A_DIR), inTan: [-7, -5], outTan: tang(A_DIR, 1) },
    { vertex: dot(A_BASE), inTan: tang(A_BASE, -1), outTan: tang(A_BASE, 1) },
  ],
};

const path = (p) => ({
  ty: "sh", nm: "neve",
  ks: fixed({
    c: p.closed,
    v: p.points.map((x) => x.vertex),
    i: p.points.map((x) => x.inTan),
    o: p.points.map((x) => x.outTan),
  }),
});

const WINDOW = 18;

const crystal = (g, r, size, pico) => ({
  ty: "gr", nm: `cristal-${pico}`,
  it: [
    { ty: "sr", sy: 1, d: 1, pt: fixed(4), p: fixed([0, 0]), r: fixed(0),
      or: fixed(size), os: fixed(0), ir: fixed(size * 0.26), is: fixed(0) },
    fills("#ffffff"),
    transform({
      p: dot(g, r),
      o: anima([
        { t: 0, v: 15 },
        { t: Math.max(1, pico - WINDOW), v: 15 },
        { t: pico, v: 100 },
        { t: Math.min(END - 1, pico + WINDOW), v: 15 },
        { t: END, v: 15 },
      ]),
    }),
  ],
});

const lottie = {
  v: "5.7.4", fr: 30, ip: 0, op: END, w: 200, h: 200, nm: "gelo", ddd: 0, assets: [],
  layers: [
    layer(1, "cristais", [crystal(298, 90, 9, 20), crystal(214, 92, 7, 45), crystal(22, 88, 8, 70)]),
    layer(2, "neve", [{ ty: "gr", nm: "monte", it: [path(neve), fills("#f4fbff", 96), transform()] }]),
    layer(3, "brilho", [{ ty: "gr", nm: "lampejo", it: [ellipse(168), trim(0, 13), stroke("#eaf8ff", 5), transform()] }],
      { r: anima([{ t: 0, v: 0 }, { t: END, v: 360 }], LINEAR) }),
    layer(4, "anel", [
      { ty: "gr", nm: "aro", it: [ellipse(168), stroke("#2b9fe0", 9), transform()] },
      { ty: "gr", nm: "fio", it: [ellipse(160), stroke("#9fdcff", 1.6, 70), transform()] },
    ]),
    layer(5, "halo", [{ ty: "gr", nm: "brilho", it: [ellipse(186), stroke("#7fd4ff", 15), transform()] }],
      { o: anima([{ t: 0, v: 22 }, { t: END / 2, v: 46 }, { t: END, v: 22 }]) }),
  ],
};

const destination = process.argv[2];
writeFileSync(destination, JSON.stringify(lottie));
console.log("escrito:", destination);
