/*
  Gera `src/assets/decoracoes/gelo.json`.

  O Lottie fica versionado pronto — isto aqui existe pra quando alguem quiser
  mudar a cor, a espessura ou o formato da neve sem editar 5 KB de JSON na mao.
  A geometria da neve depende do raio do anel, entao mexer num numero solto no
  JSON descola a neve do aro; aqui os controles de bezier sao recalculados.

    node scripts/decoracoes/gelo.mjs src/assets/decoracoes/gelo.json
*/
import { writeFileSync } from "node:fs";

const R = 84;              // mesmo raio do aro.json (elipse 168)
const FIM = 90;            // 3s a 30fps, igual as outras decoracoes
const rad = (g) => (g * Math.PI) / 180;
const ponto = (g, r = R) => [r * Math.cos(rad(g)), r * Math.sin(rad(g))];
const cor = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};

const LINEAR = { i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } };
const SUAVE = { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } };

const anima = (quadros, ease = SUAVE) => ({
  a: 1,
  k: quadros.map((q, i) =>
    i === quadros.length - 1 ? { t: q.t, s: [q.v] } : { ...ease, t: q.t, s: [q.v] },
  ),
});
const fixo = (k) => ({ a: 0, k });

const transformar = ({ p = [0, 0], o = 100, r = 0 } = {}) => ({
  ty: "tr", p: fixo(p), a: fixo([0, 0]), s: fixo([100, 100]),
  r: typeof r === "object" ? r : fixo(r),
  o: typeof o === "object" ? o : fixo(o),
});

const elipse = (d) => ({ ty: "el", nm: "circulo", p: fixo([0, 0]), s: fixo([d, d]) });
const traco = (hex, w, opacidade = 100) => ({
  ty: "st", nm: "traco", c: fixo(cor(hex)),
  o: typeof opacidade === "object" ? opacidade : fixo(opacidade),
  w: fixo(w), lc: 2, lj: 2,
});
const preenche = (hex, opacidade = 100) => ({
  ty: "fl", nm: "cheio", c: fixo(cor(hex)),
  o: typeof opacidade === "object" ? opacidade : fixo(opacidade),
});
const trim = (inicio, fim) => ({ ty: "tm", nm: "corte", s: fixo(inicio), e: fixo(fim), o: fixo(0), m: 1 });

const camada = (ind, nm, shapes, ks = {}) => ({
  ddd: 0, ind, ty: 4, nm, sr: 1,
  ks: {
    o: ks.o ?? fixo(100),
    r: ks.r ?? fixo(0),
    p: fixo([100, 100, 0]),
    a: fixo([0, 0, 0]),
    s: fixo([100, 100, 100]),
  },
  ao: 0, shapes, ip: 0, op: FIM, st: 0, bm: 0,
});

/* ---------- a neve acumulada na base do anel ----------
   O topo e uma linha irregular; o fundo acompanha a curva do anel, com os
   controles de bezier calculados a partir do raio — e nao chutados, senao a
   neve descola do aro em tamanho grande. */
const A_ESQ = 125, A_DIR = 55, A_BASE = 90;
const k = (4 / 3) * Math.tan(rad((A_BASE - A_DIR) / 4)) * R;
const tang = (g, sinal) => [sinal * -Math.sin(rad(g)) * k, sinal * Math.cos(rad(g)) * k];

const topoDaNeve = [
  [-34, 61], [-18, 68], [-2, 59], [14, 66], [30, 60], [42, 67],
];

const neve = {
  closed: true,
  points: [
    { vertex: ponto(A_ESQ), inTan: tang(A_ESQ, -1), outTan: [7, -5] },
    ...topoDaNeve.map((v) => ({ vertex: v, inTan: [-8, 0], outTan: [8, 0] })),
    { vertex: ponto(A_DIR), inTan: [-7, -5], outTan: tang(A_DIR, 1) },
    { vertex: ponto(A_BASE), inTan: tang(A_BASE, -1), outTan: tang(A_BASE, 1) },
  ],
};

const caminho = (p) => ({
  ty: "sh", nm: "neve",
  ks: fixo({
    c: p.closed,
    v: p.points.map((x) => x.vertex),
    i: p.points.map((x) => x.inTan),
    o: p.points.map((x) => x.outTan),
  }),
});

/* ---------- cristais que piscam fora de fase ----------
   Os quadros-chave saem SEMPRE em ordem crescente e comecam e terminam no
   mesmo valor. A primeira versao calculava o fim com `(meio + 45) % 90`, o que
   punha t:15 depois de t:60 na lista — o Lottie nao ordena por conta propria,
   e o cristal ficava com o pisca embaralhado. */
const JANELA = 18;

const cristal = (g, r, tamanho, pico) => ({
  ty: "gr", nm: `cristal-${pico}`,
  it: [
    { ty: "sr", sy: 1, d: 1, pt: fixo(4), p: fixo([0, 0]), r: fixo(0),
      or: fixo(tamanho), os: fixo(0), ir: fixo(tamanho * 0.26), is: fixo(0) },
    preenche("#ffffff"),
    transformar({
      p: ponto(g, r),
      o: anima([
        { t: 0, v: 15 },
        { t: Math.max(1, pico - JANELA), v: 15 },
        { t: pico, v: 100 },
        { t: Math.min(FIM - 1, pico + JANELA), v: 15 },
        { t: FIM, v: 15 },
      ]),
    }),
  ],
});

const lottie = {
  v: "5.7.4", fr: 30, ip: 0, op: FIM, w: 200, h: 200, nm: "gelo", ddd: 0, assets: [],
  layers: [
    camada(1, "cristais", [cristal(298, 90, 9, 20), cristal(214, 92, 7, 45), cristal(22, 88, 8, 70)]),
    camada(2, "neve", [{ ty: "gr", nm: "monte", it: [caminho(neve), preenche("#f4fbff", 96), transformar()] }]),
    /// O brilho e um pedaco curto do anel girando: mesma ideia do aro.json,
    /// e e o que faz o gelo parecer gelo em vez de um circulo azul.
    camada(3, "brilho", [{ ty: "gr", nm: "lampejo", it: [elipse(168), trim(0, 13), traco("#eaf8ff", 5), transformar()] }],
      { r: anima([{ t: 0, v: 0 }, { t: FIM, v: 360 }], LINEAR) }),
    camada(4, "anel", [
      { ty: "gr", nm: "aro", it: [elipse(168), traco("#2b9fe0", 9), transformar()] },
      { ty: "gr", nm: "fio", it: [elipse(160), traco("#9fdcff", 1.6, 70), transformar()] },
    ]),
    camada(5, "halo", [{ ty: "gr", nm: "brilho", it: [elipse(186), traco("#7fd4ff", 15), transformar()] }],
      { o: anima([{ t: 0, v: 22 }, { t: FIM / 2, v: 46 }, { t: FIM, v: 22 }]) }),
  ],
};

const destino = process.argv[2];
writeFileSync(destino, JSON.stringify(lottie));
console.log("escrito:", destino);
