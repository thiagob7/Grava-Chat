"""
Recorta o quadro de um Lottie ate a borda real do desenho.

    python3 apps/web/scripts/recortar.py <entrada.json> <saida.json> <nome> [--quadrado]

Existe porque estas artes vem numa TIRA LARGA — 1000x591, com a ilustracao no
meio e vazio dos lados. Enfiada numa camada quadrada em cima do avatar, a tira
sai esticada; e mesmo sem esticar, o vazio empurra o desenho pra longe da foto.
O selo do sol foi recortado na mao ontem, conferindo numero por numero; este
script e aquele trabalho escrito, porque ele voltou na primeira arte seguinte.

O recorte e uma TRANSLACAO, nao um corte destrutivo: mede onde o desenho comeca
e termina de fato (o alpha de cada PNG, passado pela transformacao da camada, em
todos os quadros-chave) e desloca todas as posicoes pra que essa caixa vire o
quadro novo. Nenhum pixel e reescrito, nenhum asset e tocado — o que muda e so
`w`, `h` e o `p` de cada camada. Um Lottie recortado assim continua abrindo em
qualquer player.
"""
import base64
import json
import sys

from png import caixa_opaca, ler_png

# ------------------------------------------------------------------ entrada

if len(sys.argv) < 4:
    sys.exit(__doc__)

entrada, saida, nome = sys.argv[1], sys.argv[2], sys.argv[3]
quadrado = "--quadrado" in sys.argv

d = json.load(open(entrada))
quadro_antigo = f"{d['w']}x{d['h']}"

# ------------------------------------------------------- onde o desenho esta

# a caixa opaca de cada asset, em pixels do PROPRIO asset
caixas = {}
for a in d["assets"]:
    if "p" not in a:
        # precomp: as camadas de dentro tem transformacao propria e este script
        # nao a compoe. Melhor parar do que devolver um recorte torto em silencio
        sys.exit(f"asset {a.get('id')!r} e uma precomp — recorte na mao, como o sol")

    largura, altura, pixels = ler_png(base64.b64decode(a["p"].split(",", 1)[1]))
    caixa = caixa_opaca(largura, altura, pixels)
    if caixa:
        caixas[a["id"]] = caixa
    print(f"  {a['id']}: {largura}x{altura} -> desenho em {caixa}")


def posicoes(camada):
    """Toda posicao que a camada assume: a fixa, ou o valor de cada quadro-chave."""
    p = camada["ks"]["p"]
    assert not p.get("s"), "posicao com x e y separados; este script nao trata"

    k = p["k"]
    if k and isinstance(k[0], dict):
        # animada: cada quadro-chave carrega o valor em `s`, e os mais velhos
        # tambem trazem o de chegada em `e`
        valores = []
        for kf in k:
            for campo in ("s", "e"):
                if campo in kf:
                    valores.append(kf[campo])
        return valores

    return [k]


x0 = y0 = float("inf")
x1 = y1 = float("-inf")

for camada in d["layers"]:
    caixa = caixas.get(camada.get("refId"))
    if not caixa:
        continue

    ancora = camada["ks"]["a"]["k"]
    escala = camada["ks"]["s"]["k"]
    assert not isinstance(escala[0], dict), "escala animada; este script nao trata"
    ex, ey = escala[0] / 100, escala[1] / 100

    for px, py, *_ in posicoes(camada):
        # o asset e desenhado com a ancora em cima da posicao, ja escalado
        x0 = min(x0, px + (caixa[0] - ancora[0]) * ex)
        y0 = min(y0, py + (caixa[1] - ancora[1]) * ey)
        x1 = max(x1, px + (caixa[2] + 1 - ancora[0]) * ex)
        y1 = max(y1, py + (caixa[3] + 1 - ancora[1]) * ey)

# ------------------------------------------------------------- o quadro novo

largura, altura = x1 - x0, y1 - y0

if quadrado:
    """
    Um quadro quadrado, centrado no desenho.

    Vale quando a arte vai virar camada em cima de um avatar redondo: ali o
    recipiente e quadrado, e um quadro 2:1 dentro dele ou estica ou sobra. Nao
    vale pra uma insignia que fica numa linha de texto — la a largura e livre, e
    forcar quadrado so acrescenta vazio em cima e embaixo.
    """
    lado = max(largura, altura)
    x0 -= (lado - largura) / 2
    y0 -= (lado - altura) / 2
    largura = altura = lado

for camada in d["layers"]:
    p = camada["ks"]["p"]
    k = p["k"]

    if k and isinstance(k[0], dict):
        for kf in k:
            for campo in ("s", "e"):
                if campo in kf:
                    kf[campo] = [kf[campo][0] - x0, kf[campo][1] - y0, *kf[campo][2:]]
    else:
        p["k"] = [k[0] - x0, k[1] - y0, *k[2:]]

d["w"], d["h"] = round(largura), round(altura)
d["nm"] = nome

json.dump(d, open(saida, "w"), separators=(",", ":"))

print()
print(f"desenho em {x0:.1f},{y0:.1f} ate {x1:.1f},{y1:.1f}")
print(f"quadro {d['w']}x{d['h']} (era {quadro_antigo})")
print(f"gravado em {saida}")
