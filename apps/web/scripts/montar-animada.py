"""
Monta uma decoracao animada a partir de QUADROS de arte pintada.

    python3 apps/web/scripts/montar-animada.py <saida.json> <arte.png[:papel]> ...

Papeis:
    quadro   (padrao) entra no reveza: cada um acende na sua vez
    base     fica parado o tempo todo, atras de tudo
    topo     fica parado o tempo todo, na FRENTE de tudo (caveira, gema, cristal)
    gira+8   gira uma volta a cada 8s no sentido horario, somando luz
    gira-12  idem, anti-horario

Este e o meio do caminho da loja: a arte chega pintada (gerada ou de
ilustrador), em dois ou mais quadros do mesmo desenho, e sai um Lottie que
alterna entre eles. Fogo, fumaca e brilho e assim que se animam de verdade —
trocando de FORMA, nao escalando ou girando a mesma imagem.

Tres coisas que ele faz e que errar sai caro:

1. NORMALIZA PELO FURO, nao pelo desenho. Os quadros quase nunca vem no mesmo
   tamanho nem centrados no mesmo ponto; o que precisa coincidir entre eles, e
   com a foto embaixo, e o buraco. Alinhado pelo desenho, o aro treme.

2. CONVERTE PRA WEBP. O PNG do sol.json pesa 244 KB e o mesmo desenho em WebP
   pesa 60 e poucos — 70% a menos, medido. Numa loja de cem itens isso e a
   diferenca entre 50 MB e 11 MB de decoracao.

3. GIRA o que voce mandar girar. Trocar entre dois desenhos parados PISCA; nao
   corre. Fogo que corre sao camadas deslizando uma sobre a outra em velocidades
   diferentes — e o truque de sempre em tempo real. Precisa de uma arte SEM os
   elementos fixos (caveira, gema, cristal), senao eles giram junto e viram de
   cabeca pra baixo.

4. Diz a FOLGA no fim. E a conta que liga o furo ao avatar, e e o numero que
   vai pra `lib/cosmeticos/animadas.ts`.

O que ele NAO faz: separar arte sobreposta. Peca os quadros ja separados a quem
gera; reconstruir o que esta atras de outra coisa e trabalho de pintura, nao de
script.
"""
import base64
import json
import math
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from png import escrever_png, ler_png  # noqa: E402

FR, OP = 30, 120
FURO_ALVO = 360
ALVO_DA_FOTO = 0.88     # quanto do avatar o furo cobre; ver `folga` em animadas.ts


def medir(caminho):
    """
    Onde fica o centro do aro, e qual o tamanho do FURO.

    O centro sai da SILHUETA EXTERNA: a linha mais larga do desenho e o
    diametro do circulo, entao e ali que fica o centro. Parece rodeio, e nao e —
    medir pelo vao interno falha justamente nesta arte, porque um aro de
    labaredas separadas tem FRESTA entre elas: a varredura horizontal escapa por
    uma fresta e mede 565px de "furo" num aro cujo furo tem 461. Foi assim que a
    primeira versao saiu 92px fora do lugar, com o aro pendurado abaixo da foto.

    Com o centro em maos, o furo e a distancia dali ate bater em desenho — e na
    linha mais larga as labaredas sao grossas dos dois lados, sem fresta.
    """
    with open(caminho, "rb") as f:
        w, h, px = ler_png(f.read())

    def alfa(x, y):
        return px[(y * w + x) * 4 + 3]

    x0, y0, x1, y1 = w, h, -1, -1
    larguras = []
    for y in range(h):
        e = next((x for x in range(w) if alfa(x, y) > 16), None)
        if e is None:
            continue
        d = next(x for x in range(w - 1, e - 1, -1) if alfa(x, y) > 16)
        larguras.append((d - e, y, (e + d) // 2))
        x0, x1 = min(x0, e), max(x1, d)
        y0, y1 = min(y0, y), max(y1, y)

    _, cy, cx = max(larguras)

    e = cx
    while e > 0 and alfa(e - 1, cy) < 16:
        e -= 1
    d = cx
    while d < w - 1 and alfa(d + 1, cy) < 16:
        d += 1

    return {"w": w, "h": h, "px": px, "arte": (x0, y0, x1, y1),
            "fx": cx, "fy": cy, "diam": d - e + 1}


def reamostrar(m, k, lado):
    """Bilinear. Vizinho-proximo serrilha a borda macia da chama."""
    px, w, h = m["px"], m["w"], m["h"]
    saida = bytearray(lado * lado * 4)

    for Y in range(lado):
        sy = (Y - lado / 2) / k + m["fy"]
        iy = math.floor(sy)          # `int()` trunca pro zero e inverte o peso
        fy = sy - iy                 # nos negativos — a imagem sai com lixo
        if iy < 0 or iy >= h - 1:
            continue
        base = Y * lado * 4
        for X in range(lado):
            sx = (X - lado / 2) / k + m["fx"]
            ix = math.floor(sx)
            fx = sx - ix
            if ix < 0 or ix >= w - 1:
                continue
            o = base + X * 4
            for c in range(4):
                p00 = px[(iy * w + ix) * 4 + c]
                p10 = px[(iy * w + ix + 1) * 4 + c]
                p01 = px[((iy + 1) * w + ix) * 4 + c]
                p11 = px[((iy + 1) * w + ix + 1) * 4 + c]
                v = (p00 * (1 - fx) * (1 - fy) + p10 * fx * (1 - fy)
                     + p01 * (1 - fx) * fy + p11 * fx * fy)
                saida[o + c] = 0 if v < 0 else (255 if v > 255 else int(v))
    return saida


def webp(lado, pixels):
    """PNG -> WebP pelo `cwebp`. `-alpha_q 100` mantem o alfa sem perda."""
    with tempfile.TemporaryDirectory() as tmp:
        p, w = os.path.join(tmp, "a.png"), os.path.join(tmp, "a.webp")
        escrever_png(p, lado, lado, pixels)
        subprocess.run(["cwebp", "-q", "90", "-alpha_q", "100", p, "-o", w],
                       check=True, capture_output=True)
        with open(w, "rb") as f:
            return f.read()


def girar(voltas_por_s, sentido):
    """Uma volta inteira, linear. Qualquer easing aqui faz o laco solavancar."""
    graus = 360 * sentido * (OP / FR) / voltas_por_s
    return {"a": 1, "k": [
        {"t": 0, "s": [0], "i": {"x": [0.5], "y": [0.5]}, "o": {"x": [0.5], "y": [0.5]}},
        {"t": OP, "s": [graus]}]}


def bruxulear(baixo, alto):
    """Respiro de opacidade, tres batidas por laco — fogo nao pulsa devagar."""
    ks, batidas = [], 3
    passo = OP // (batidas * 2)
    for n in range(batidas * 2 + 1):
        t = min(n * passo, OP)
        kf = {"t": t, "s": [alto if n % 2 else baixo]}
        if t < OP:
            kf["i"] = {"x": [0.4], "y": [1]}
            kf["o"] = {"x": [0.6], "y": [0]}
        ks.append(kf)
    return {"a": 1, "k": ks}


def piscar(i, total):
    """
    A opacidade de UM quadro ao longo do laco.

    Cada quadro fica aceso na sua vez e apaga rapido. Rampa curta de proposito:
    fogo troca de forma depressa, e uma dissolvencia longa vira imagem dupla —
    parece foto tremida, nao chama.
    """
    passo = OP / total
    inicio, fim = i * passo, (i + 1) * passo
    rampa = passo * 0.22
    qs = [(0, 100 if i == 0 else 0)]
    for t, v in [(inicio - rampa, 0), (inicio, 100), (fim - rampa, 100), (fim, 0)]:
        t = round(t)
        if 0 < t < OP:
            qs.append((t, v))
    qs.append((OP, 100 if i == 0 else 0))

    limpo, visto = [], set()
    for t, v in sorted(qs):
        if t not in visto:
            visto.add(t)
            limpo.append({"t": t, "s": [v],
                          "i": {"x": [0.6], "y": [1]}, "o": {"x": [0.4], "y": [0]}})
    limpo[-1].pop("i", None)
    limpo[-1].pop("o", None)
    return {"a": 1, "k": limpo}


def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)

    saida, pedidos = sys.argv[1], sys.argv[2:]
    papeis = [(p.split(":") + ["quadro"])[:2] for p in pedidos]
    quadros = [c for c, _ in papeis]
    ms = [medir(q) for q in quadros]

    ks = [FURO_ALVO / m["diam"] for m in ms]
    def alcance(m, k):
        x0, y0, x1, y1 = m["arte"]
        return max(abs(x0 - m["fx"]), abs(x1 - m["fx"]),
                   abs(y0 - m["fy"]), abs(y1 - m["fy"])) * k

    lado = int(2 * max(alcance(m, k) for m, k in zip(ms, ks))) + 4
    lado += lado % 2

    # o mesmo desenho pode servir a duas camadas girando; embute UMA vez so
    assets, por_arquivo = [], {}
    for q, m, k in zip(quadros, ms, ks):
        if q in por_arquivo:
            continue
        dados = webp(lado, reamostrar(m, k, lado))
        por_arquivo[q] = f"img_{len(assets)}"
        assets.append({"id": por_arquivo[q], "w": lado, "h": lado, "u": "", "e": 1,
                       "p": "data:image/webp;base64," + base64.b64encode(dados).decode()})
        print(f"  {os.path.basename(q)}: furo ø{m['diam']} -> WebP {len(dados) // 1024} KB")

    # meia-largura do desenho, ja na escala do quadro comum: para um aro isso e
    # o raio externo. A altura nao serve — caveira pendurada embaixo a infla.
    def raio(m, k):
        return (m["arte"][2] - m["arte"][0]) / 2 * k

    # a referencia e a maior camada PARADA. Sem nenhuma, quem gira fica no
    # proprio tamanho — antes isto caia em 1 e encolhia o fogo a quase nada.
    paradas = [raio(m, k) for (_, papel), m, k in zip(papeis, ms, ks)
               if not papel.startswith("gira")]
    raio_de_referencia = max(paradas) if paradas else None

    quantos_quadros = sum(1 for _, papel in papeis if papel == "quadro")
    camadas, vez = [], 0
    girou = 0
    for (q, papel), m, k in zip(papeis, ms, ks):
        opac, rot, escala, mistura = {"a": 0, "k": 100}, {"a": 0, "k": 0}, 100, 0

        if papel == "quadro":
            opac = piscar(vez, quantos_quadros) if quantos_quadros > 1 else opac
            vez += 1
        elif papel.startswith("gira"):
            segundos = float(papel[5:] or 8)
            rot = girar(segundos, 1 if papel[4] == "+" else -1)
            # `bm: 2` e SCREEN: chama sobre chama soma luz em vez de tapar.
            # Sem isso a camada de cima apaga a de baixo e o giro some.
            # SEMPRE somando luz (`bm: 2`, screen), nunca opaca.
            #
            # Uma camada girando opaca SUBSTITUI a arte parada, e arte parada e
            # onde mora a riqueza do desenho — foi assim que o fogo ficou magro
            # e a caveira lavada. Girando por cima em screen, ela so acrescenta
            # luz viajando: o desenho continua inteiro e ganha movimento.
            opac, mistura = bruxulear(22, 46), 2
            girou += 1
            # Casa o RAIO EXTERNO com o da base, e não só o furo: um aro sem os
            # elementos fixos costuma ser proporcionalmente mais fino, e
            # normalizado só pelo furo ele cai num raio menor — aí não é fogo
            # correndo, é imagem dupla, e o desenho de baixo some lavado.
            escala = 100.0 if raio_de_referencia is None else round(
                raio_de_referencia / raio(m, k) * 100, 1)
            if papel[4] == "-":
                escala *= 0.96

        camadas.append({
            "ddd": 0, "ind": len(camadas) + 1, "ty": 2, "nm": f"{os.path.basename(q)}:{papel}",
            "refId": por_arquivo[q], "sr": 1,
            "ks": {"o": opac, "r": rot,
                   "p": {"a": 0, "k": [lado / 2, lado / 2, 0]},
                   "a": {"a": 0, "k": [lado / 2, lado / 2, 0]},
                   "s": {"a": 0, "k": [escala, escala, 100]}},
            "ao": 0, "ip": 0, "op": OP, "st": 0, "bm": mistura,
        })

    # no Lottie o indice 1 fica na FRENTE, entao `topo` vai pro comeco e `base`
    # pro fim
    ordem = {"topo": 0, "base": 2}
    camadas.sort(key=lambda c: ordem.get(c["nm"].rsplit(":", 1)[1], 1))
    for i, c in enumerate(camadas):
        c["ind"] = i + 1

    doc = {"v": "5.7.4", "fr": FR, "ip": 0, "op": OP, "w": lado, "h": lado,
           "nm": os.path.basename(saida).replace(".json", ""),
           "ddd": 0, "assets": assets, "layers": camadas}
    with open(saida, "w") as f:
        json.dump(doc, f, separators=(",", ":"))

    fracao = FURO_ALVO / lado
    folga = -((ALVO_DA_FOTO / fracao) - 1) / 2
    maior = max(max(m["arte"][2] - m["arte"][0], m["arte"][3] - m["arte"][1]) / m["diam"]
                for m in ms)
    print(f"\nquadro {lado}x{lado}, {len(quadros)} quadros, {OP} a {FR}fps")
    print(f"furo ø{FURO_ALVO} = {fracao:.1%} do quadro  ->  folga: \"{folga:.0%}\"")
    print(f"a arte fica {maior:.2f}x o avatar (sol 1,64x / alada 1,72x)")
    print(f"{os.path.getsize(saida) / 1024:.0f} KB -> {saida}")


if __name__ == "__main__":
    main()
