import { useCallback, useEffect, useRef, type RefObject } from "react";

/**
 * O player de Lottie, com todas as armadilhas já desviadas.
 *
 * Mora aqui, e não dentro de um componente, porque já são dois enfeites que
 * precisam do mesmo ciclo de vida — a decoração em volta do avatar e a patente
 * ao lado do nome. As três correções que este arquivo carrega (o clone, o
 * congelamento no último quadro, o `destroy` na saída) foram achadas uma a uma
 * na tela, e nenhuma delas dá erro no console quando falta. Copiadas pro segundo
 * componente, a primeira a ser esquecida ia levar semanas pra ser notada.
 *
 * Usa o `lottie-web` na build LEVE — JavaScript puro, sem WASM.
 *
 * "Leve" tira o suporte a expressões do After Effects, que nenhum enfeite usa: o
 * arquivo cai pela metade e, de brinde, some o `eval` que a build cheia carrega
 * — que seria um problema no dia que este app ganhar uma CSP séria.
 *
 * A alternativa moderna (`@lottiefiles/dotlottie-web`) busca o `.wasm` num CDN
 * por padrão, e isso é exatamente a armadilha que a Inter já nos custou: falha
 * calada no aplicativo de desktop sem internet alcançável. Aqui não há nada a
 * buscar em tempo de execução.
 */
interface Player {
  destroy: () => void;
  goToAndStop: (v: number, f?: boolean) => void;
  playSegments: (s: [number, number], forcar?: boolean) => void;
  resetSegments: (forcar?: boolean) => void;
  totalFrames: number;
}

interface Opcoes {
  /**
   * O id do enfeite. É a lista de dependências do efeito — `carregar` é uma
   * função nova a cada render e não serve pra isso.
   */
  chave: string;
  /** O desenho, ou `null` quando o id não tem arte embutida. */
  carregar: () => Promise<unknown | null>;
  /**
   * Parada em lista, andando no cartão — a mesma regra do resto do catálogo.
   * Cem avatares tocando animação ao mesmo tempo engasgam a rolagem, e quem
   * paga é quem só queria ler quem está online.
   *
   * Pode LIGAR E DESLIGAR a qualquer momento: na chamada ele acompanha o "está
   * falando", que muda a cada frase. Por isso ligar e desligar não recria o
   * player — só manda tocar ou congelar no desenho que já está montado.
   */
  animar: boolean;
  /**
   * Repete pra sempre, ou toca uma vez e para?
   *
   * As duas respostas estão certas, cada uma pra uma arte. Decoração de avatar
   * é um enfeite de fundo que respira o tempo todo. Patente é uma insígnia que
   * se MONTA: as peças saem do meio e assentam. Repetir isso faria as asas
   * atravessarem a linha do nome a cada oito segundos.
   */
  repetir: boolean;
  /**
   * O trecho que vale a pena repetir, quando a arte tem uma ENTRADA.
   *
   * Só faz sentido com `repetir`. Ver `segmento` em `animadas.ts`.
   */
  segmento?: [number, number];
}

export function usarLottie(
  caixa: RefObject<HTMLElement | null>,
  { chave, carregar, animar, repetir, segmento }: Opcoes,
) {
  const [de, ate] = segmento ?? [];

  const player = useRef<Player | null>(null);
  /**
   * O comprimento ORIGINAL do desenho, guardado antes do primeiro
   * `playSegments`.
   *
   * Depois de tocar um trecho, `totalFrames` passa a ser o tamanho DO TRECHO, e
   * não o do arquivo. Quem congela precisa do número de antes, senão o "último
   * quadro" vira o último quadro do pedaço.
   */
  const comprimento = useRef(0);

  /**
   * O que se quer AGORA, lido sem entrar na lista de dependências de quem cria
   * o player. É isto que deixa ligar e desligar sem recriar nada.
   */
  const desejo = useRef({ animar, de, ate });
  desejo.current = { animar, de, ate };

  const aplicar = useCallback(() => {
    const p = player.current;
    if (!p) return;

    const alvo = desejo.current;

    /**
     * Parado, congela no ÚLTIMO quadro — não no primeiro.
     *
     * Essas artes CRESCEM na entrada: no quadro 0 as asas e a estrela estão
     * com escala zero, e só o aro existe. Congelando no início, o enfeite
     * aparecia pela metade na lista de membros e inteiro só no cartão — a
     * mesma pessoa com duas caras, sem erro nenhum no console.
     */
    if (!alvo.animar) {
      /*
        Desfaz o TRECHO antes de congelar.

        O lottie desenha `currentFrame + firstFrame`, e tocar um trecho move o
        `firstFrame` pro começo dele. Congelar sem desfazer, numa arte com
        trecho — o selo do sol começa no 49 —, pedia o quadro 144 e desenhava o
        193, que não existe. Some quando a pessoa para de falar e o enfeite
        assenta num quadro que ninguém desenhou.
      */
      p.resetSegments(true);
      p.goToAndStop(Math.max(0, comprimento.current - 1), true);
      return;
    }

    /*
      Tocar é sempre `playSegments`, mesmo sem trecho declarado.

      Um `play()` solto retomaria de onde parou — e onde parou é o último
      quadro, porque foi lá que o congelamento deixou. Dizer o trecho inteiro
      recomeça do começo, que é o que se espera de uma decoração que "dá o
      play" quando a pessoa começa a falar.
    */
    p.playSegments([alvo.de ?? 0, alvo.ate ?? comprimento.current], true);
  }, []);

  useEffect(() => {
    let vivo = true;

    void (async () => {
      // os dois `import()` são dinâmicos: nem o player nem o desenho entram no
      // carregamento inicial
      const [lottie, dados] = await Promise.all([
        import("lottie-web/build/player/lottie_light"),
        carregar(),
      ]);

      if (!vivo || !caixa.current || !dados) return;

      /**
       * O `animationData` vai CLONADO.
       *
       * O lottie-web muta o objeto que recebe — ele guarda estado do player
       * dentro do próprio desenho. Como o `import()` devolve sempre a mesma
       * instância do JSON, o segundo player a usar o mesmo arquivo recebia um
       * objeto já mastigado e não desenhava nada: o enfeite aparecia numa
       * pessoa e sumia na outra, sem erro nenhum no console.
       */
      const novo = lottie.default.loadAnimation({
        container: caixa.current,
        renderer: "svg",
        loop: repetir,
        // quem decide tocar ou congelar é o `aplicar`, logo abaixo, e ele é o
        // mesmo caminho de toda mudança depois desta
        autoplay: false,
        animationData: structuredClone(dados),
      }) as Player;

      player.current = novo;
      comprimento.current = novo.totalFrames;
      aplicar();
    })();

    return () => {
      vivo = false;
      player.current?.destroy();
      player.current = null;
    };
    // `animar` e o trecho ficam de fora: mudá-los NÃO recria o player, só chama
    // o `aplicar` no efeito de baixo. `carregar` também fica — ver `chave`.
  }, [caixa, chave, repetir, aplicar]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Liga e desliga sem tocar no player.
   *
   * Na chamada isto acompanha o "está falando", que pisca a cada frase.
   * Recriando o player a cada mudança, a decoração recomeçaria do zero — e pior,
   * pagaria o clone do JSON inteiro toda vez que alguém abre a boca.
   */
  useEffect(() => aplicar(), [animar, de, ate, aplicar]);
}
