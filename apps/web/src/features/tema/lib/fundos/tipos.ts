/*
  Um motor de fundo é código nosso que um tema apenas ESCOLHE.

  Tema é `.css`, e vai continuar sendo: CSS de estranho já mexe na tela
  inteira, e deixar um tema trazer JavaScript junto seria entregar a sessão
  de quem instalou. Então o tema escreve `--gc-fundo: fogos` e quem desenha
  somos nós, com um motor que já estava aqui.

  É a mesma troca do `gc-ativo()`: o tema diz o que quer, o app resolve.
*/
export interface Palco {
  tela: HTMLCanvasElement;
  contexto: CanvasRenderingContext2D;
  largura: number;
  altura: number;
}

export interface Motor {
  /* Roda uma vez por quadro. `passo` vem em segundos, já limitado. */
  quadro: (palco: Palco, passo: number) => void;
  /* Chamado quando a janela muda de tamanho, antes do próximo quadro. */
  redimensionou?: (palco: Palco) => void;
  /* O que fazer com um clique. Sem isso, o fundo ignora o mouse. */
  clicou?: (palco: Palco, x: number, y: number) => void;
}
