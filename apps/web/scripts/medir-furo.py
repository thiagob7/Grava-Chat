"""
Mede o FURO de uma decoracao animada — o buraco por onde a foto aparece.

    python3 apps/web/scripts/medir-furo.py <arquivo.json> <id-do-asset>

Existe porque medir no olho da errado: no selo do sol eu chutei 327px e o furo
tinha 305; na moldura alada chutei 69% do quadro e eram 84% da imagem. Com o
numero errado, ou a moldura come a foto ou o enfeite fica gigante em volta dela.

A leitura do PNG mora em `png.py`, dividida com o `recortar.py`.

Com o diametro em maos, a folga sai de:

    folga = -((alvo / (furo / lado)) - 1) / 2

onde `alvo` e o quanto do avatar o furo deve cobrir (0.9 deixa a moldura
encostando na borda da foto, que e como moldura de verdade se comporta).
"""
import base64
import json
import sys

from png import ler_png

arquivo, indice = sys.argv[1], sys.argv[2]
d = json.load(open(arquivo))
asset = next(a for a in d["assets"] if a.get("id") == indice)
w, h, px = ler_png(base64.b64decode(asset["p"].split(",", 1)[1]))

def alpha(x, y):
    return px[(y * w + x) * 4 + 3]

# varre a linha do meio procurando o buraco central
meio_y = h // 2
transparentes = [x for x in range(w) if alpha(x, meio_y) < 16]
# o furo e a maior sequencia continua de transparencia que contem o centro
centro = w // 2
esq = centro
while esq > 0 and alpha(esq - 1, meio_y) < 16: esq -= 1
dir = centro
while dir < w - 1 and alpha(dir + 1, meio_y) < 16: dir += 1

meio_x = (esq + dir) // 2
topo = meio_y
while topo > 0 and alpha(meio_x, topo - 1) < 16: topo -= 1
base = meio_y
while base < h - 1 and alpha(meio_x, base + 1) < 16: base += 1

print(f"imagem {w}x{h}")
print(f"furo horizontal: {esq}..{dir}  (diametro {dir-esq+1}, centro x={meio_x})")
print(f"furo vertical:   {topo}..{base}  (diametro {base-topo+1}, centro y={(topo+base)//2})")
