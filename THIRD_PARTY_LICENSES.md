# Licenças de terceiros

O que vem de fora e sob que condições. Cada linha aponta para o aviso completo.

| Onde | O quê | Licença |
| --- | --- | --- |
| `apps/web/public/emoji/` | Gráficos do Twemoji, de `jdecked/twemoji` (pacote `@twemoji/svg@15.0.0`) | **CC-BY-4.0** — exige atribuição. Veja [`apps/web/public/licencas/twemoji-NOTICE.md`](apps/web/public/licencas/twemoji-NOTICE.md) e o texto em [`CC-BY-4.0.txt`](apps/web/public/licencas/CC-BY-4.0.txt). |
| ícones da interface | [Phosphor Icons](https://phosphoricons.com) e [Lucide](https://lucide.dev) | MIT / ISC |
| fontes | pacotes `@fontsource/*` | SIL OFL 1.1, com a licença dentro de cada pacote |
| supressão de ruído | `@sapphi-red/web-noise-suppressor` (RNNoise) | MIT / BSD-3 |

## Por que os avisos ficam em `public/`

Porque assim eles são **publicados junto com o app**, e não só versionados aqui.
A atribuição do CC-BY precisa alcançar quem usa o produto, e um arquivo que só
existe no repositório não alcança. Em produção eles ficam em
`/licencas/twemoji-NOTICE.md`.

Há também um `NOTICE.md` dentro de `public/emoji/`, escrito pelo
`scripts/copiar-emoji.mjs`: aquela pasta é derivada e fica fora do git, e quem
topar com ela solta — num build, num zip do `dist` — precisa conseguir saber de
onde os arquivos vieram.

Nenhum aviso de licença aqui concede direitos sobre marcas ou nomes comerciais
de terceiros.
