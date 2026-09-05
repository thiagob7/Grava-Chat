/*
  Quanto cabeçalho o servidor aceita num pedido.

  O Node corta aos 16 KB e responde 431 antes de o Fastify ver qualquer coisa.
  Em produção isso nunca acontece: só os nossos cookies viajam. Em localhost o
  navegador manda junto o cookie de TODO projeto que roda na mesma máquina —
  cookie não separa por porta — e o bolo passa dos 16 KB fácil. O login parava
  de funcionar sem erro que ajudasse.

  32 KB dá folga sem virar porta aberta: o teto existe para não guardarmos
  cabeçalho de graça na memória.
*/
export const TETO_DE_CABECALHO = 32 * 1024;
