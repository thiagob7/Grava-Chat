"""
Le um PNG RGBA de 8 bits sem depender de Pillow.

Mora aqui, e nao dentro de quem usa, porque ja sao dois scripts precisando da
mesma coisa: `medir-furo.py` procura o buraco da moldura e `recortar.py` procura
a borda do desenho. Os dois abrem o mesmo PNG embutido em base64 dentro do
Lottie, e nenhum dos dois quer arrastar uma dependencia so pra isso.

E decodificacao na mao de proposito. Instalar Pillow num script que roda tres
vezes por ano e o tipo de coisa que quebra justo no dia que alguem precisa: o
ambiente mudou, o wheel nao compila, e a resposta e "esquece, chuta no olho" —
que e exatamente o erro que estes scripts existem pra evitar.
"""
import struct
import zlib


def ler_png(dados: bytes):
    """Devolve `(largura, altura, pixels)`, com os pixels em RGBA cru."""
    assert dados[:8] == b"\x89PNG\r\n\x1a\n", "isso nao e um PNG"

    i, idat, info = 8, b"", None
    while i < len(dados):
        (tam,) = struct.unpack(">I", dados[i : i + 4])
        tipo = dados[i + 4 : i + 8]
        corpo = dados[i + 8 : i + 8 + tam]
        if tipo == b"IHDR":
            info = struct.unpack(">IIBB", corpo[:10])
        elif tipo == b"IDAT":
            # o IDAT vem PICADO em varios chunks; e um fluxo zlib so, entao os
            # pedacos se concatenam antes de descomprimir
            idat += corpo
        i += 12 + tam

    largura, altura, profundidade, cor = info
    canais = {2: 3, 6: 4}.get(cor)
    assert profundidade == 8 and canais, (
        f"esperava RGB ou RGBA de 8 bits, veio profundidade={profundidade} cor={cor}"
    )

    cru = _desfiltrar(zlib.decompress(idat), largura, altura, canais)

    # sai SEMPRE em RGBA, opaco quando a origem não tinha alfa. Quem chama mede
    # alfa em `i + 3` sem precisar saber o que veio no arquivo.
    if canais == 4:
        return largura, altura, cru

    rgba = bytearray(largura * altura * 4)
    for i in range(largura * altura):
        rgba[i * 4:i * 4 + 3] = cru[i * 3:i * 3 + 3]
        rgba[i * 4 + 3] = 255
    return largura, altura, rgba


def _desfiltrar(cru: bytes, largura: int, altura: int, canais: int = 4) -> bytearray:
    """
    Desfaz o filtro de linha do PNG.

    Cada linha vem prefixada por um byte dizendo como ela foi codificada em
    relacao a linha de cima e ao pixel da esquerda. Sem desfazer isso os bytes
    parecem ruido — e o alpha, que e o que interessa aqui, sai errado sem gritar.
    """
    passo = largura * canais
    saida = bytearray(altura * passo)
    anterior = bytearray(passo)
    p = 0

    for y in range(altura):
        filtro = cru[p]
        p += 1
        linha = bytearray(cru[p : p + passo])
        p += passo

        # 0 (nenhum) e o caso comum e nao precisa de volta nenhuma
        if filtro != 0:
            for x in range(passo):
                a = linha[x - canais] if x >= canais else 0
                b = anterior[x]
                c = anterior[x - canais] if x >= canais else 0

                if filtro == 1:
                    linha[x] = (linha[x] + a) & 255
                elif filtro == 2:
                    linha[x] = (linha[x] + b) & 255
                elif filtro == 3:
                    linha[x] = (linha[x] + (a + b) // 2) & 255
                elif filtro == 4:
                    pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                    pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                    linha[x] = (linha[x] + pr) & 255

        saida[y * passo : (y + 1) * passo] = linha
        anterior = linha

    return saida


def caixa_opaca(largura: int, altura: int, pixels, limite: int = 16):
    """
    A menor caixa que contem tudo que NAO e transparente.

    E o que separa o desenho da sobra: estas artes vem num quadro largo com a
    ilustracao no meio e vazio dos lados, e e a sobra que faz a decoracao sair
    deformada quando o quadro vira uma camada quadrada em cima do avatar.
    """
    x0, y0, x1, y1 = largura, altura, -1, -1

    for y in range(altura):
        base = y * largura * 4
        for x in range(largura):
            if pixels[base + x * 4 + 3] >= limite:
                if x < x0:
                    x0 = x
                if x > x1:
                    x1 = x
                if y < y0:
                    y0 = y
                if y > y1:
                    y1 = y

    if x1 < 0:
        return None

    return x0, y0, x1, y1


def escrever_png(caminho, largura, altura, pixels):
    """
    Grava RGBA de 8 bits, sem filtro de linha.

    Filtro 0 em todas as linhas: o arquivo sai maior do que sairia com um
    codificador esperto, e nao importa — nada daqui e o que vai pro app. Estas
    imagens sao passo INTERMEDIARIO; quem entrega e o `cwebp` depois.
    """
    passo = largura * 4
    cru = bytearray()
    for y in range(altura):
        cru.append(0)
        cru += pixels[y * passo:(y + 1) * passo]

    def bloco(tipo, corpo):
        return (struct.pack(">I", len(corpo)) + tipo + corpo
                + struct.pack(">I", zlib.crc32(tipo + corpo) & 0xFFFFFFFF))

    with open(caminho, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(bloco(b"IHDR", struct.pack(">IIBBBBB", largura, altura, 8, 6, 0, 0, 0)))
        f.write(bloco(b"IDAT", zlib.compress(bytes(cru), 6)))
        f.write(bloco(b"IEND", b""))


def tirar_o_preto(largura, altura, pixels, piso=40):
    """
    Transforma arte sobre PRETO em arte com alfa de verdade.

    Fogo, brilho e neon sao desenhados somando luz sobre preto: onde nao ha
    desenho, o pixel e (0,0,0). Entao o alfa E o brilho do pixel — e a cor
    verdadeira e o pixel dividido por esse alfa. Recortar isso com limiar duro
    (`se nao for preto, opaco`) serrilha toda a borda macia da chama, que e
    justamente o que faz a arte parecer boa.

    `piso` limpa a POEIRA: fundo "preto" quase nunca e preto puro — sobra um
    lixo de 16 a 40 de alfa que, sobre fundo escuro, vira um arco cinza sujo em
    volta do desenho. O corte e uma RAMPA, e nao um limiar: o que estava no piso
    vai a zero e o resto e reescalado, entao a borda macia da chama continua
    macia. Limiar duro aqui serrilha tudo.
    """
    saida = bytearray(largura * altura * 4)
    for i in range(0, largura * altura * 4, 4):
        r, g, b = pixels[i], pixels[i + 1], pixels[i + 2]
        a = max(r, g, b)
        if a <= piso:
            continue
        # despremultiplica: a cor volta ao que era antes de ser somada ao preto
        saida[i] = min(255, r * 255 // a)
        saida[i + 1] = min(255, g * 255 // a)
        saida[i + 2] = min(255, b * 255 // a)
        saida[i + 3] = min(255, (a - piso) * 255 // (255 - piso))
    return saida


def partir(largura, altura, pixels, teste, suavidade=25):
    """
    Divide uma arte em DUAS camadas por um teste de cor, sem costura.

    Serve pra soltar o que precisa ficar PARADO do que precisa se MEXER: numa
    coroa de fogo com cavieras, a chama gira e a caveira nao pode girar junto.

    `teste(r, g, b)` devolve o quanto o pixel pertence a segunda camada. O corte
    e uma rampa de `suavidade`, e nao um sim/nao: com limiar duro aparece uma
    franja serrilhada exatamente onde a chama encosta na caveira. Os dois pesos
    somam 1, entao as duas camadas empilhadas dao a imagem original de volta.
    """
    a = bytearray(largura * altura * 4)
    b = bytearray(largura * altura * 4)

    for i in range(0, largura * altura * 4, 4):
        alfa = pixels[i + 3]
        if not alfa:
            continue
        peso = teste(pixels[i], pixels[i + 1], pixels[i + 2]) / suavidade
        peso = 0.0 if peso < 0 else (1.0 if peso > 1 else peso)

        a[i:i + 3] = pixels[i:i + 3]
        b[i:i + 3] = pixels[i:i + 3]
        a[i + 3] = int(alfa * (1 - peso))
        b[i + 3] = int(alfa * peso)

    return a, b
