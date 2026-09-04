import React, { useEffect, useRef, useState } from "react";
import { Maximize, Mic, MicOff, Minimize, Monitor, MonitorUp, Play, SignalLow, Volume2, VolumeX, X } from "lucide-react";

import { ChatCircle, SpeakerHigh, UserPlus } from "@phosphor-icons/react";

import { InviteModal } from "~/components/InviteModal";
import { QualidadeDaTela } from "~/components/QualidadeDaTela";

import type {
  Channel,
  GuildMember,
  Permission,
  Role,
  VoiceState,
} from "@gravae/shared";

import { useVoicePrefs } from "~/stores/voice-prefs";
import { useVoiceStore, type VoiceTile } from "~/stores/voice-store";
import { focar, formatoDaGrade, montarGrade } from "~/lib/grade-da-call";
import { avisoDeQualidade } from "~/lib/qualidade-da-conexao";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Slider } from "~/components/ui/slider";
import { Tooltip } from "~/components/ui/tooltip";
import { Avatar } from "~/components/Avatar";
import { UserProfilePopover } from "~/components/UserProfilePopover";
import { VoiceMemberMenu } from "~/components/VoiceMemberMenu";
import { VoiceStageControls } from "~/components/VoiceStageControls";
import { useTelaCheia } from "~/hooks/use-tela-cheia";
import { VoiceVideo } from "~/components/VoiceTrack";
import { useParticipante } from "~/hooks/use-participante";
import { useSomDoPainel } from "~/lib/soundboard";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface VoiceStageProps {
  channelName: string;
  guildId?: string;
  members?: GuildMember[];
  roles?: Role[];
  canaisDeVoz?: Channel[];
  voiceStates?: VoiceState[];
  minhasPermissoes?: Permission[];
  currentUserId?: string;
  /*
    Formato de conversa privada: uma fileira de rostos em vez da grade.

    Num servidor a chamada é o assunto da tela inteira. No privado ela divide
    espaço com a conversa, que continua sendo o principal — e são duas pessoas,
    não doze. Grade de quadros grandes ali gasta a altura que a conversa precisa
    e não mostra nada a mais.
  */
  compacto?: boolean;
  /// o nome do servidor, só pro diálogo de convite saber pra onde convida
  guildName?: string;
  /*
    O chat da chamada é estado da TELA, não do palco: quem desenha o painel
    escrito ao lado é o `Chat.tsx`, e o mesmo interruptor já existe no
    cabeçalho. O palco só ganha um segundo caminho até ele, no canto de cima —
    dois botões para o mesmo estado, e não dois estados.
  */
  chatAberto?: boolean;
  onAlternarChat?: () => void;
  podeConvidar?: boolean;
}

/**
 * Os cantos da chamada: nome do canal, chat e convite.
 *
 * Flutuam SOBRE o palco em vez de morar numa barra própria. Uma barra roubaria
 * altura justamente de onde ela é mais cara — a chamada é a tela inteira, e
 * cada faixa fixa é uma fileira de rostos a menos. Sobre o palco, os três só
 * ocupam o canto que já era vazio.
 *
 * A camada inteira é `pointer-events-none` e cada botão devolve o clique com
 * `pointer-events-auto`: sem isso, um retângulo invisível cobriria o topo da
 * grade e comeria o clique de quem quisesse destacar o quadro de cima.
 *
 * O texto leva sombra porque o que está atrás não é sempre o fundo escuro do
 * palco: com uma pessoa só, o vídeo vai de ponta a ponta, e branco sobre
 * imagem clara some.
 */
const CantosDaChamada: React.FC<{
  nome: string;
  chatAberto?: boolean;
  onAlternarChat?: () => void;
  onConvidar?: () => void;
}> = ({ nome, chatAberto, onAlternarChat, onConvidar }) => {
  const { t } = useTranslation();

  /*
    Só o ícone, sem cápsula.

    A bolinha escura em volta existia para o ícone branco não sumir sobre vídeo
    claro — mas ela é uma peça a mais desenhada sobre a imagem, e são duas
    (chat e convite) nos cantos. A sombra faz o mesmo trabalho sem ocupar
    espaço: o ícone continua legível sobre qualquer fundo.

    E o realce do mouse é o ícone CLAREANDO, como na referência: em repouso ele
    fica a 70% do branco, e sob o mouse vai a 100%. Antes o que mudava era o
    fundo da cápsula, então quem passasse o mouse via a caixa acender, não o
    botão.
  */
  /*
    O botão do HUD da chamada, na medida da referência.

    Lido do `VoiceCallView.module.css` do Fluxer (`.voiceHeaderIconButton`):
    34px, raio de 13px, fundo preto sólido, borda branca a 8% e um fio de luz
    por dentro (`inset 0 1px 0` a 5,5%). No hover e no ligado, a borda sobe pra
    14%, o fundo pra `#111` e o ícone pra branco cheio.

    O ícone solto com sombra que estava aqui dependia do que houvesse atrás pra
    ser legível: sobre um vídeo claro ele sumia. O fundo preto resolve isso de
    uma vez, que é a razão de a referência ter um.

    `aria-pressed` faz o estado ligado: o mesmo atributo que já dizia isso pra
    quem usa leitor de tela agora também pinta o botão, sem classe extra.
  */
  const botao =
    "pointer-events-auto flex size-[2.125rem] shrink-0 items-center justify-center rounded-[0.8125rem] border border-white/[0.08] bg-black text-white/[0.84] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] transition-colors duration-75 hover:border-white/[0.14] hover:bg-[#111] hover:text-white aria-pressed:border-white/[0.14] aria-pressed:bg-[#111] aria-pressed:text-white";

  return (
    <>
      {/*
        A faixa de cima é `regiao-de-arrasto`.

        Sem cabeçalho, esta é a única tira livre no alto da janela — e no
        aplicativo, num macOS de barra escondida, ela é o que sobra pra
        arrastar a janela pela tela. O CSS já devolve o clique a botões e
        links de dentro, então os cantos continuam clicáveis.
      */}
      <div
        className={cn(
          "regiao-de-arrasto pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-3",
          /*
            Somem com o mouse, como a pílula de controles.

            É a mesma regra dela, palavra por palavra — e tem de ser: dois
            grupos de botões flutuando sobre o mesmo vídeo, um que some e outro
            que fica, é pior que os dois ficarem. `focus-within` para que quem
            navega por teclado consiga chegar neles sem mouse nenhum.
          */
          "opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100",
        )}
      >
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.9)]">
          <SpeakerHigh
            size={20}
            weight="fill"
            className="shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          />
          <span className="truncate">{nome}</span>
        </span>

        {onAlternarChat && (
          <Tooltip
            label={chatAberto ? t("chamada.fecharChat") : t("chamada.mostrarChat")}
            side="left"
          >
            <button
              onClick={onAlternarChat}
              aria-pressed={chatAberto}
              aria-label={chatAberto ? t("chamada.fecharChat") : t("chamada.mostrarChat")}
              /// Aberto, ele acende sozinho: o `aria-pressed` acima é o que o
              /// `botao` já usa pra pintar o estado ligado.
              className={botao}
            >
              <ChatCircle size={20} weight="fill" />
            </button>
          </Tooltip>
        )}
      </div>

      {onConvidar && (
        <Tooltip label={t("chamada.convidar")} side="right">
          <button
            onClick={onConvidar}
            aria-label={t("chamada.convidar")}
            /*
              Canto de baixo à esquerda, onde a pílula de controles não chega:
              ela é centralizada e ancorada na mesma altura (`bottom-4`), então
              os dois convivem sem se cobrir em tela nenhuma.
            */
            className={cn(
              botao,
              "absolute bottom-4 left-4 z-10",
              "opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100",
            )}
          >
            <UserPlus size={20} weight="fill" />
          </button>
        </Tooltip>
      )}
    </>
  );
};

/*
  O espaço entre os quadros encolhe conforme a chamada enche.

  É a tabela da referência (`getVoiceGridGap`), e a razão dela é simples: com
  muita gente, folga é espaço que não virou rosto. Doze pixels entre dois
  quadros é respiro; entre vinte, é um quinto da tela gasto em vão.
*/
const espacoDaGrade = (quadros: number) => {
  if (quadros >= 40) return 4;
  if (quadros >= 24) return 6;
  if (quadros >= 12) return 8;
  if (quadros >= 6) return 10;
  return 12;
};

export const VoiceStage: React.FC<VoiceStageProps> = ({
  channelName,
  guildId,
  members = [],
  roles = [],
  canaisDeVoz = [],
  voiceStates = [],
  minhasPermissoes = [],
  currentUserId,
  compacto = false,
  guildName,
  chatAberto,
  onAlternarChat,
  podeConvidar = false,
}) => {
  const { t } = useTranslation();
  const palco = useRef<HTMLDivElement>(null);
  const quadro = useRef<HTMLDivElement>(null);
  /// qual quadro está em destaque; `null` é a grade igualitária
  const [focado, setFocado] = useState<string | null>(null);
  const [convidando, setConvidando] = useState(false);

  /*
    Tela cheia no QUADRO, não na janela inteira: assim a barra de participantes
    e o resto do app somem, e o vídeo ocupa o monitor.
  */
  const telaCheia = useTelaCheia(quadro);
  const todosOsTiles = useVoiceStore((s) => s.tiles);
  const mostrarSemVideo = useVoicePrefs((s) => s.mostrarSemVideo);

  /*
    Quem está sem câmera e sem tela pode sair da grade.

    Numa chamada de oito pessoas com duas câmeras ligadas, os seis retratos
    parados espremem justamente o que tem imagem. Quem desliga isso continua
    ouvindo todo mundo — some da GRADE, não da chamada. O local nunca some:
    sumir a si mesmo confunde mais do que ajuda.
  */
  const tiles = mostrarSemVideo
    ? todosOsTiles
    : todosOsTiles.filter((t) => t.isLocal || t.cameraTrack || t.screenTrack);
  const connecting = useVoiceStore((s) => s.connecting);

  const assistindo = useVoiceStore((s) => s.assistindo);
  const setAssistindo = useVoiceStore((s) => s.assistir);
  const definirPalcoVisivel = useVoiceStore((s) => s.definirPalcoVisivel);

  useEffect(() => {
    definirPalcoVisivel(true);
    return () => definirPalcoVisivel(false);
  }, [definirPalcoVisivel]);
  const error = useVoiceStore((s) => s.error);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-medium text-danger">{t("chamada.naoEntrou")}</p>
        <p className="max-w-sm text-sm text-ink-muted">{error}</p>
      </div>
    );
  }

  if (connecting) {
    return (
      <div className="flex flex-1 items-center justify-center text-ink-muted">
        {t("chamada.conectando")}
      </div>
    );
  }

  const sharing = assistindo
    ? tiles.find((t) => t.identity === assistindo && t.screenTrack)
    : null;

  const contexto = {
    guildId,
    members,
    roles,
    canaisDeVoz,
    voiceStates,
    minhasPermissoes,
    currentUserId,
  };

  if (sharing) {
    return (
      <div
        ref={palco}
        /*
          Sem margem em volta do vídeo.

          Os 16px de folga custavam área de tela justamente na hora em que
          alguém está tentando LER o que o outro compartilha — código, planilha,
          um jogo. As faixas de cima e de baixo já flutuam sobre o vídeo, então
          a borda não separava nada: só encolhia.
        */
        className={cn(
          "group relative flex min-h-0 flex-1 overflow-hidden bg-black",
          compacto ? "flex-row gap-2 p-2" : "flex-col",
        )}
      >
        <div ref={quadro} className="relative min-w-0 flex-1 overflow-hidden bg-black">
          {/*
            O vídeo inteiro é o botão de voltar.

            Assistir é um estado, não uma tela sem saída: o caminho de volta
            precisa ser tão grande quanto o de ida. O botão "Parar de assistir"
            continua na faixa de cima pra quem procura por um botão — este é
            pra quem só quer sair.
          */}
          <button
            onClick={() => setAssistindo(null)}
            aria-label={t("chamada.voltarAosQuadros")}
            className="absolute inset-0 size-full cursor-pointer"
          >
            <VoiceVideo track={sharing.screenTrack!} />
          </button>

          {/*
            Duas faixas sobre o vídeo, como no Discord: quem transmite em cima,
            controles embaixo. Ficam DENTRO do quadro de propósito — em tela
            cheia elas vão junto, e é justamente aí que se precisa delas.

            O degradê existe pra legibilidade: texto branco sobre imagem clara
            some, e uma barra sólida comeria pedaço do vídeo.
          */}
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/80 to-transparent px-4",
              compacto ? "pb-6 pt-2" : "pb-8 pt-3",
            )}
          >
            {/*
              "Fulano está transmitindo" some no privado: numa conversa de duas
              pessoas, dizer de quem é a tela é repetir o nome que já está no
              cabeçalho — e ali o espaço vertical é do vídeo, não da legenda.
            */}
            {!compacto && (
              <>
                <MonitorUp size={14} className="shrink-0 text-white/70" />
                <span className="text-sm font-medium">Tela de {sharing.name}</span>
                <QualidadeDaTela track={sharing.screenTrack!} />
              </>
            )}

            <span className="ml-auto rounded bg-danger px-1.5 py-0.5 text-10 font-bold tracking-wide">
              {t("chamada.live.etiquetaMaiuscula")}
            </span>

            {/*
              "Parar de assistir" vive aqui em cima, e não na faixa de baixo,
              porque lá ele caía exatamente debaixo da pílula de controles — o
              `VoiceStageControls` é ancorado em `bottom-4` do palco, e o botão
              ficava centralizado na mesma altura. Ele existia, era renderizado,
              e simplesmente não dava pra clicar.

              O `pointer-events-auto` é obrigatório: a faixa inteira é
              `pointer-events-none` pra não roubar o clique do vídeo.
            */}
            <button
              onClick={() => setAssistindo(null)}
              className="pointer-events-auto flex shrink-0 items-center gap-1.5 rounded bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition hover:bg-white/25"
            >
              <X size={14} /> {t("chamada.live.pararDeAssistir")}
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10">
            {/* as pastilhas de quem está na chamada não cabem no privado, e
                não fazem falta: são duas pessoas, e uma delas é você */}
            {!compacto && (
              <div className="flex shrink-0 gap-2">
                {tiles.map((tile) => (
                  <ComMenu key={tile.identity} tile={tile} contexto={contexto}>
                    <Tile tile={tile} guildId={guildId} compact />
                  </ComMenu>
                ))}
              </div>
            )}

            <button
              onClick={() => void telaCheia.alternar()}
              aria-label={telaCheia.ativa ? "Sair da tela cheia" : "Tela cheia"}
              title={telaCheia.ativa ? "Sair da tela cheia (Esc)" : "Tela cheia"}
              className="ml-auto shrink-0 rounded p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              {telaCheia.ativa ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>

        {/*
          Quem está na chamada, numa coluna ao lado do vídeo.

          Assistindo, o vídeo ocupa tudo e some a informação de quem está falando
          ou mudo. Antes essas pastilhas viviam SOBRE o vídeo, na faixa de baixo —
          ali elas tapavam justamente o canto onde costuma estar a barra de tarefas
          de quem transmite. Ao lado, não disputam pixel com nada.
        */}
        {compacto && (
          <div className="flex w-16 shrink-0 flex-col items-center gap-3 overflow-y-auto py-1">
            {tiles.map((tile) => (
              <ComMenu key={tile.identity} tile={tile} contexto={contexto}>
                <RostoDaColuna tile={tile} />
              </ComMenu>
            ))}
          </div>
        )}

        <VoiceStageControls alvoTelaCheia={palco} mostrarChat={compacto} />
      </div>
    );
  }

  /*
    Quem transmite ocupa dois quadros — o dele e o da live —, e não um só com a
    transmissão desenhada por cima. Antes, abrir uma live fazia o avatar do dono
    sumir atrás do botão "Assistir": justamente quem estava mostrando algo era
    quem desaparecia da chamada.

    A regra mora em `lib/grade-da-call.ts` porque é decisão, não desenho — e lá
    ela tem teste.
  */
  const grade = montarGrade(
    tiles.map((tile) => ({ identity: tile.identity, transmitindo: Boolean(tile.screenTrack), tile })),
  );

  const { colunas, denso } = formatoDaGrade(grade.length);
  const emFoco = focar(grade, focado);

  /*
    Ampliado: o quadro foi clicado e não há ninguém pra pôr na faixa de baixo.

    A referência não reserva a tira quando ela ficaria vazia — lá a faixa só
    existe se houver um segundo quadro. Sem essa distinção, clicar sozinho caía
    no layout de destaque e o quadro encolhia até virar um selo, dividindo a
    altura com uma tira que não tinha nada dentro.
  */
  const ampliado = emFoco?.faixa.length === 0;

  /*
    `preencher` troca o 16:9 do quadro por "ocupe tudo".

    O `aspect-video` existe pra grade não virar uma colcha de retângulos de
    alturas diferentes. Com UM quadro só ele vira o problema: o quadro fica com
    a altura que a largura mandar e sobra uma tira preta embaixo, que foi
    exatamente o que apareceu quando alguém entrava sozinho na chamada.
  */
  const desenhar = (
    quadro: (typeof grade)[number],
    compacto?: boolean,
    preencher?: boolean,
    semCanto?: boolean,
  ) =>
    quadro.tipo === "tela" ? (
      <TileDaLive
        key={quadro.key}
        tile={quadro.de.tile}
        denso={denso || compacto}
        className={preencher ? "size-full" : undefined}
        onAssistir={() => setAssistindo(quadro.de.identity)}
      />
    ) : (
      <ComMenu key={quadro.key} tile={quadro.de.tile} contexto={contexto}>
        <Tile
          tile={quadro.de.tile}
          guildId={guildId}
          denso={denso || compacto}
          preencher={preencher}
          semCanto={semCanto}
          onFocar={() => setFocado((atual) => (atual === quadro.key ? null : quadro.key))}
        />
      </ComMenu>
    );

  /*
    Clicar num quadro destaca ele e joga o resto numa faixa embaixo — clicar de
    novo desfaz. A grade igualitária dá o mesmo espaço pra todo mundo mesmo
    quando só uma pessoa interessa naquele instante; o foco é o que resolve.
  */
  if (emFoco && emFoco.faixa.length) {
    return (
      /*
        `pb-20`, e não `p-4` nos quatro lados.

        A pílula de controles é ancorada em `bottom-4` do palco e tem ~52px:
        ocupa de 16 a 68px do rodapé — exatamente onde a faixa de quadros
        pequenos ficava. O resultado era a miniatura da live escondida atrás dos
        botões, com metade dela aparecendo pelas bordas.
      */
      <div
        ref={palco}
        /*
          A folga de cima só existe quando os cantos existem. No privado eles
          não aparecem — o nome de quem está do outro lado já está no cabeçalho
          da conversa, a um centímetro dali, e repeti-lo sobre o vídeo seria
          gastar altura pra dizer duas vezes a mesma coisa.
        */
        className={cn(
          /*
            `min-h-0` e `overflow-hidden` são o que impedem o app de ganhar
            barra de rolagem ao destacar um quadro.

            Item de flex não encolhe abaixo do próprio conteúdo por padrão
            (`min-height: auto`): com o quadro grande em cima e a faixa de
            miniaturas embaixo, o palco crescia além da janela e empurrava a
            página inteira. Os filhos daqui já tinham os seus; faltava no palco.
          */
          "group relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden bg-surface-2 pb-20",
          compacto ? "p-4 pb-20" : "px-4 pt-14",
        )}
      >
        {!compacto && (
          <CantosDaChamada
            nome={channelName}
            chatAberto={chatAberto}
            onAlternarChat={onAlternarChat}
            onConvidar={podeConvidar ? () => setConvidando(true) : undefined}
          />
        )}

        {/*
          O quadro em destaque guarda a proporção, com preto em volta.

          Antes ele PREENCHIA a área: esticava a imagem até os cantos e cortava
          o que sobrava. Ampliar deixava de mostrar a mesma coisa maior — passava
          a mostrar um pedaço dela.

          A tira preta em cima e embaixo é o que a referência faz, e não é
          desperdício de tela: é a área que não pertence à imagem. Fingir que
          pertence custa pedaço do vídeo.

          `aspect-video` com os dois tetos (`max-h-full` e `max-w-full`) resolve
          sozinho de que lado sobra preto: numa área larga sobra dos lados, numa
          alta sobra em cima e embaixo — o que estiver mais apertado manda.
        */}
        {/* Sem canto arredondado: quem emoldura aqui é o preto em volta, e um
            cartão com quina no meio dele deixa quatro mordidas à vista. */}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">
          {/*
            `w-full` é o que dá base para a proporção crescer, e `max-h-full` é
            o teto. Só com os dois máximos a caixa não tem de onde partir e
            encolhe até o conteúdo — vira um selo no meio do preto.
          */}
          <div className="aspect-video w-full max-h-full [&>*]:size-full">
            {desenhar(emFoco.destaque, false, true)}
          </div>
        </div>

        <div className="flex shrink-0 justify-center gap-2">
          {emFoco.faixa.map((quadro) => (
            <div key={quadro.key} className="w-40 shrink-0">
              {desenhar(quadro, true)}
            </div>
          ))}
        </div>

        <VoiceStageControls alvoTelaCheia={palco} mostrarChat={compacto} />

        {/*
          O diálogo mora nos dois ramos que mostram o botão, e não no topo do
          componente: cada `return` do palco é uma árvore diferente, e um
          diálogo pendurado num ramo que não renderizou não abre.
        */}
        <InviteModal
          open={convidando}
          guildId={guildId}
          guildName={guildName}
          onClose={() => setConvidando(false)}
        />
      </div>
    );
  }

  if (compacto) {
    return (
      <div
        ref={palco}
        /*
          `pb-20` porque a pílula de controles é ancorada em `bottom-4` do
          palco e tem ~52px de altura: ela ocupa de 16px a 68px do rodapé. Sem
          essa folga ela pousa em cima dos nomes — foi o que aconteceu, com
          "Thiago (você)" cortado ao meio.
        */
        className="group relative flex min-h-0 flex-1 items-center justify-center gap-5 overflow-hidden bg-surface-2 p-4 pb-20"
      >
        {/*
          Cartão, e não retrato solto.

          Os avatares flutuando no vazio não diziam onde uma pessoa acaba e a
          outra começa — e, quando alguém ligava a câmera, o vídeo entrava num
          quadro enquanto os outros seguiam soltos, cada um com uma forma.
          Cartão pra todos: a chamada de duas fica igual à de oito, com dois.
        */}
        {grade.map((quadro) => (
          <div key={quadro.key} className="h-full max-h-56 min-w-0 max-w-md flex-1">
            {desenhar(quadro, false, true)}
          </div>
        ))}

        {!tiles.length && <p className="text-ink-muted">Ninguém em {channelName} ainda.</p>}

        <VoiceStageControls alvoTelaCheia={palco} mostrarChat={compacto} />
      </div>
    );
  }

  return (
    <div
      ref={palco}
      className={cn(
        "group relative flex min-h-0 flex-1 items-center justify-center overflow-hidden",
        /*
          Ampliado é o que o clique promete: o quadro toma o palco de ponta a
          ponta e os controles passam a flutuar por cima, em vez de terem tira
          reservada embaixo. Sem isso, com uma pessoa só, clicar não mudava
          nada na tela — e era exatamente esse o pedido.

          No normal, com um quadro só, o palco é o preto em volta e a folga é
          igual dos quatro lados. As medidas vivem no `.quadro-de-um` do
          `index.css`, que precisa saber destes mesmos valores pra fazer a conta
          do 16:9.

          Com vários, a margem lateral e o teto de largura existem pra grade não
          virar uma parede de quadros gigantes.
        */
        ampliado
          ? "palco-de-um bg-black"
          : grade.length === 1
            ? "palco-de-um bg-black px-3 pb-20 pt-3.5"
            /*
              Com vários, o palco também vira contêiner de consulta: a conta da
              grade usa a ALTURA dele, e largura em CSS não enxerga altura de
              pai. As folgas são as mesmas do quadro sozinho, porque a conta que
              as desconta é a mesma.
            */
            : "palco-de-um bg-surface-2 px-3 pb-20 pt-3.5",
      )}
    >
        <CantosDaChamada
          nome={channelName}
          chatAberto={chatAberto}
          onAlternarChat={onAlternarChat}
          onConvidar={podeConvidar ? () => setConvidando(true) : undefined}
        />

      {/*
        `min-h-0` e `overflow-hidden` acima, `max-h-full` aqui: sem os três, a
        grade cresce além da altura reservada e vaza pra fora do palco. Numa
        conversa privada isso aparecia como os quadros da chamada sobrepondo o
        cabeçalho da conversa, com o nome de quem escreveu no meio deles.
      */}
      <div
        className={cn(
          grade.length > 1 && "grade-de-varios",
          /// Um quadro só: a conta do 16:9 mora no `.quadro-de-um`. O `grid` e o
          /// `max-h-full` estavam na base de todos e vieram junto pra cá — a
          /// grade de vários tem os seus próprios, no `.grade-de-varios`.
          grade.length === 1 && "grid max-h-full quadro-de-um [&>*]:size-full",
          /// Ampliado é o mesmo quadro com as folgas em zero; o canto reto vem
          /// pelo `semCanto`, porque `[&>*]` aqui pararia no `ComMenu`.
          ampliado && "quadro-de-um-ampliado",
        )}
        style={
          grade.length > 1
            ? /*
                Colunas, linhas e o espaço entre elas vão como variáveis porque
                a conta do tamanho do quadro precisa dos três. O espaço encolhe
                com a lotação, como na referência: com muita gente, folga é
                espaço que não vira rosto.
              */
              ({
                "--colunas": colunas,
                "--linhas": Math.ceil(grade.length / colunas),
                "--espaco": `${espacoDaGrade(grade.length)}px`,
              } as React.CSSProperties)
            : { gridTemplateColumns: "repeat(1, minmax(0, 1fr))", gridAutoRows: "minmax(0, 1fr)" }
        }
      >
        {grade.map((quadro) => desenhar(quadro, false, grade.length === 1, ampliado))}
      </div>
      {!tiles.length && (
        <p className="text-ink-muted">Ninguém em {channelName} ainda.</p>
      )}

      <VoiceStageControls alvoTelaCheia={palco} mostrarChat={compacto} />

      <InviteModal
        open={convidando}
        guildId={guildId}
        guildName={guildName}
        onClose={() => setConvidando(false)}
      />
    </div>
  );
};

interface TileProps {
  tile: VoiceTile;
  /// Só pra que o cartão de perfil saiba de onde tirar os cargos — o menu de
  /// contexto do quadro vem de fora, pelo `ComMenu`.
  guildId?: string;
  /// pastilha da barra inferior, enquanto se assiste a alguém
  compact?: boolean;
  /// chamada cheia: quadros e avatares encolhem pra caber sem rolagem
  denso?: boolean;
  /// sozinho na chamada: ocupa a área toda em vez de guardar o 16:9
  preencher?: boolean;
  /*
    Canto reto: só no quadro ampliado.

    É o que a referência faz — no modo foco ela zera o raio do quadro. E aqui
    tem motivo próprio: sem folga em volta, o canto arredondado encosta na borda
    da área e deixa quatro mordidas pretas à vista.
  */
  semCanto?: boolean;
  /// clicar no quadro alterna o modo destaque
  onFocar?: () => void;
}

const Tile: React.FC<TileProps> = ({
  tile,
  guildId,
  compact,
  denso,
  preencher,
  semCanto,
  onFocar,
}) => {
  const { t } = useTranslation();
  const resolver = useParticipante();
  const espelhar = useVoicePrefs((s) => s.espelharCamera);
  /// O som do painel acende o rosto igual à fala — quem apertou é quem está
  /// fazendo barulho na chamada.
  const tocandoSom = useSomDoPainel((s) => s.quem === tile.identity);
  const falando = tile.speaking || tocandoSom;
  const participante = resolver(tile.identity, {
    name: tile.name,
    avatarUrl: tile.avatarUrl,
  });

  /*
    A transmissão NÃO é mais desenhada aqui em cima. Ela tem quadro próprio
    (`TileDaLive`), e este voltou a ser o que sempre deveria ter sido: a pessoa.
  */
  return (
    <div
      /*
        O clique de destaque mora no PRÓPRIO quadro. Envolver tudo num `<button>`
        seria botão dentro de botão — o nome ali embaixo já é um, e o HTML
        inválido come o clique de dentro em parte dos navegadores.
      */
      onClick={onFocar}
      className={cn(
        "group/tile relative flex items-center justify-center overflow-hidden bg-surface-1 transition",
        /*
          O canto arredondado vale sempre que há folga em volta — inclusive no
          quadro sozinho, que continua sendo um cartão pousado no preto. Já
          cheguei a tirá-lo achando que o quadro virava fundo; não vira.
          `rounded-xl` é o raio da referência.

          A exceção é o ampliado (`semCanto`), onde a folga é zero: ali a
          referência também zera o raio, e sem folga o canto arredondado só
          deixaria quatro mordidas pretas encostadas na borda.
        */
        !semCanto && "rounded-xl",
        onFocar && "cursor-pointer",
        /*
          A pastilha tem tamanho fixo em vez de `aspect-video h-full`: como ela
          divide a faixa com o botão de tela cheia, herdar a altura da faixa
          deixava as três espremidas e o avatar minúsculo.
        */
        compact ? "h-16 w-24 shrink-0" : preencher ? "size-full" : "aspect-video",
      )}
    >
      {tile.cameraTrack ? (
        <div className={cn("size-full", falando && "ring-2 ring-online")}>
          <VoiceVideo track={tile.cameraTrack} mirrored={tile.isLocal && espelhar} />
        </div>
      ) : (
        <Avatar
          id={tile.identity}
          name={participante.nome}
          url={participante.avatarUrl}
          size={compact ? 44 : denso ? 52 : 80}
          enfeites={participante.perfil}
          animar={falando}
        />
      )}

      {/*
        A etiqueta é limitada à largura do quadro e nunca quebra linha: sem isso,
        num quadro pequeno o nome envolvia em duas linhas e subia por cima do
        avatar. Nome comprido agora é cortado com reticências.
      */}
      <div
        className={cn(
          "absolute bottom-1.5 left-1.5 flex max-w-[calc(100%-0.75rem)] items-center gap-1 rounded bg-black/60 px-1.5 py-0.5",
          !compact && "bottom-2 left-2 gap-1.5 px-2 py-1",
        )}
      >
        {tile.micEnabled ? (
          <Mic size={12} className="shrink-0 text-ink-muted" />
        ) : (
          <MicOff size={12} className="shrink-0 text-danger" />
        )}

        <AvisoDeConexao qualidade={tile.qualidade} />
        <UserProfilePopover userId={tile.identity} guildId={guildId} side="top">
          <button
            /// o nome abre o perfil, e só — sem isto ele destacaria o quadro junto
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "min-w-0 truncate whitespace-nowrap font-medium hover:underline",
              /*
                Na pastilha o nome só aparece com o mouse em cima. Numa caixa de
                96px, microfone + nome + reticências não cabem sem espremer os
                dois; o avatar é o que identifica a pessoa ali, e o nome fica a
                um passar de mouse de distância.
              */
              compact
                ? "w-0 overflow-hidden text-10 opacity-0 transition-all group-hover/tile:w-auto group-hover/tile:opacity-100"
                : "text-xs",
            )}
          >
            {participante.nome}
            {tile.isLocal && " (você)"}
          </button>
        </UserProfilePopover>
      </div>
    </div>
  );
};

/**
 * O quadro da transmissão de alguém — irmão do quadro da pessoa, não substituto.
 *
 * Não desenha a imagem da live aqui de propósito. Assinar o vídeo de toda
 * transmissão só pra mostrar miniatura na grade custa banda e CPU, e a tela é
 * publicada numa camada única (sem `screenShareSimulcastLayers`): o SFU teria
 * que mandar 1080p pra cada miniatura, no Micro de 1/8 de núcleo. Enquanto a
 * camada baixa não existir, o cartão escuro com o convite é o certo — assinar
 * o vídeo é decisão de quem clica em "Assistir".
 */
const TileDaLive: React.FC<{
  tile: VoiceTile;
  denso?: boolean;
  onAssistir: () => void;
  /*
    Na grade o quadro recebe a largura da coluna. Numa FILEIRA flex ele não
    recebe nada: `aspect-video` sem largura nem altura colapsa pra zero, e a
    live simplesmente não aparecia. Quem monta a fileira precisa dar o tamanho.
  */
  className?: string;
}> = ({ tile, denso, onAssistir, className }) => {
  const { t } = useTranslation();

  return (
  <div
    className={cn(
      "group/live relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-black/70 ring-1 ring-white/10",
      className,
    )}
  >
    {/*
      A SUA transmissão aparece aberta; a dos outros, não.

      Não é inconsistência — é que as duas custam coisas diferentes. A sua tela
      já está capturada e correndo nesta máquina: desenhar ela aqui não assina
      nada e não pede um byte a mais ao SFU. A dos outros exigiria assinar o
      vídeo, e como a tela é publicada em camada única seria 1080p por
      miniatura, de todo mundo, o tempo todo.

      Por isso a sua vem aberta e a dos outros vem como convite. Quando existir
      a camada baixa (`screenShareSimulcastLayers`), as duas podem vir abertas.
    */}
    {/*
      Quem transmite vê a própria live ABERTA; quem vai assistir vê o convite.

      São papéis diferentes na mesma tela. Você precisa conferir o que está
      mandando — se pegou a janela certa, se o jogo está ali — e um cartão
      fechado não responde isso. Já quem não está transmitindo precisa de um
      convite, não de mais uma imagem competindo por atenção.

      E só a sua abre porque só ela é de graça: sua tela já está capturada nesta
      máquina, desenhar aqui não assina nada. A dos outros exigiria assinar o
      vídeo, e como a tela é publicada em camada única seria 1080p por
      miniatura, de todo mundo, o tempo todo.
    */}
    {tile.isLocal && tile.screenTrack ? (
      <button onClick={onAssistir} className="absolute inset-0 size-full">
        <VoiceVideo track={tile.screenTrack} />

        <span className="pointer-events-none absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-danger px-2 py-0.5 text-10 font-bold uppercase tracking-wide text-white">
          <span className="size-1.5 animate-pulse rounded-full bg-white" /> {t("chamada.live.etiqueta")}
        </span>
      </button>
    ) : (
      /*
        O selo "ao vivo" fica SEMPRE; o convite, só com o mouse em cima.

        São dois papéis: o selo informa (tem gente transmitindo ali), o convite
        propõe (clique pra ver). Com os dois acesos o tempo todo, a grade de
        quatro quadros virava quatro botões piscando disputando o clique.
      */
      <button
        onClick={onAssistir}
        className="absolute inset-0 flex items-center justify-center transition hover:bg-white/5"
      >
        <span className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-danger px-2 py-0.5 text-10 font-bold uppercase tracking-wide text-white">
          <span className="size-1.5 animate-pulse rounded-full bg-white" /> {t("chamada.live.etiqueta")}
        </span>

        {/*
          No quadro pequeno, só o triângulo.

          A frase inteira não cabia numa miniatura: ela quebrava em duas linhas
          e o botão tomava quase o quadro todo, tapando justamente a imagem que
          ele convida a ver. O triângulo sozinho diz a mesma coisa no espaço que
          existe — o rótulo continua no `title`, para quem passa o mouse e para
          quem lê a tela.
        */}
        <span
          title={t("chamada.live.assistir")}
          className={cn(
            "flex items-center justify-center bg-brand font-medium text-white shadow-lg",
            "opacity-0 transition group-hover/live:opacity-100",
            denso
              ? "size-9 rounded-full"
              : "gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm",
          )}
        >
          <Play size={denso ? 16 : 16} />
          {!denso && t("chamada.live.assistir")}
        </span>
      </button>
    )}

    <div className="pointer-events-none absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded bg-black/60 px-2 py-1">
      <Monitor size={12} className="shrink-0 text-online" />
      <span className="min-w-0 truncate whitespace-nowrap text-xs font-medium">
        {tile.name}
        {tile.isLocal && " (sua tela)"}
      </span>
    </div>

    {/* som da própria tela não volta pra você — não há o que regular */}
    {!tile.isLocal && <ControleDeVolumeDaLive identity={tile.identity} className="absolute bottom-2 right-2" />}
  </div>
  );
};

/**
 * O volume da transmissão, separado do volume da voz de quem transmite.
 *
 * São duas queixas diferentes: "não escuto ele" e "o jogo dele está estourando".
 * Com um controle só, abaixar o barulho da live emudecia a pessoa junto.
 */
const ControleDeVolumeDaLive: React.FC<{ identity: string; className?: string }> = ({
  identity,
  className,
}) => {
  const volume = useVoiceStore((s) => Math.min(1, s.volumesDeTela[identity] ?? 1));
  const definir = useVoiceStore((s) => s.setVolumeDeTela);

  return (
    <Popover>
      <Tooltip label={volume === 0 ? "Live sem som" : `Volume da live · ${Math.round(volume * 100)}%`}>
        <PopoverTrigger asChild>
          <button
            aria-label="Volume da live"
            className={cn(
              "pointer-events-auto rounded bg-black/60 p-1.5 text-white/80 transition hover:bg-black/80 hover:text-white",
              className,
            )}
          >
            {volume === 0 ? <VolumeX size={14} className="text-danger" /> : <Volume2 size={14} />}
          </button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent side="top" align="end" className="w-48 p-3">
        <p className="mb-2 text-xs font-medium text-ink-muted">
          Volume da live · {Math.round(volume * 100)}%
        </p>

        <Slider
          min={0}
          max={1}
          step={0.05}
          value={volume}
          preenchido={volume}
          onChange={(e) => definir(identity, Number(e.target.value))}
        />
      </PopoverContent>
    </Popover>
  );
};

/**
 * O selo de conexão ruim, na etiqueta do quadro.
 *
 * Só aparece quando há o que avisar — a regra e o porquê estão em
 * `lib/qualidade-da-conexao.ts`. Aqui é só o desenho.
 */
const AvisoDeConexao: React.FC<{ qualidade: string }> = ({ qualidade }) => {
  const aviso = avisoDeQualidade(qualidade);
  if (!aviso) return null;

  return (
    <Tooltip label={aviso.rotulo}>
      <span className={cn("flex shrink-0 items-center", aviso.cor)} aria-label={aviso.rotulo}>
        <SignalLow size={12} className={aviso.pulsando ? "animate-pulse" : undefined} />
      </span>
    </Tooltip>
  );
};

/**
 * Um rosto na coluna lateral, enquanto se assiste a uma transmissão.
 *
 * Menor que o `RostoNaChamada` e sem nome: aqui o espaço é de 64px e a pergunta
 * que se responde é outra. Não é "quem está na chamada" — isso o cabeçalho já
 * diz — é "quem está falando agora, e quem está mudo".
 */
const RostoDaColuna: React.FC<{ tile: VoiceTile }> = ({ tile }) => {
  const espelhar = useVoicePrefs((s) => s.espelharCamera);
  /// O som do painel acende o rosto igual à fala — quem apertou é quem está
  /// fazendo barulho na chamada.
  const tocandoSom = useSomDoPainel((s) => s.quem === tile.identity);
  const falando = tile.speaking || tocandoSom;
  const resolver = useParticipante();
  const participante = resolver(tile.identity, { name: tile.name, avatarUrl: tile.avatarUrl });

  return (
    <div className="relative shrink-0" title={participante.nome}>
      {tile.cameraTrack ? (
        <div className="size-11 overflow-hidden rounded-full">
          <VoiceVideo track={tile.cameraTrack} mirrored={tile.isLocal && espelhar} />
        </div>
      ) : (
        <Avatar
          id={tile.identity}
          name={participante.nome}
          url={participante.avatarUrl}
          size={44}
          enfeites={participante.perfil}
          animar={falando}
        />
      )}

      {!tile.micEnabled && (
        <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-surface-0 ring-2 ring-surface-2">
          <MicOff size={9} className="text-danger" />
        </span>
      )}
    </div>
  );
};

interface ContextoDoPalco {
  guildId?: string;
  members: GuildMember[];
  roles: Role[];
  canaisDeVoz: Channel[];
  voiceStates: VoiceState[];
  minhasPermissoes: Permission[];
  currentUserId?: string;
}

const ComMenu: React.FC<{
  tile: VoiceTile;
  contexto: ContextoDoPalco;
  children: React.ReactNode;
}> = ({ tile, contexto, children }) => {
  if (!contexto.guildId) return <>{children}</>;

  return (
    <VoiceMemberMenu
      guildId={contexto.guildId}
      userId={tile.identity}
      displayName={
        contexto.members.find((m) => m.user.id === tile.identity)?.user.displayName ?? tile.name
      }
      voiceState={contexto.voiceStates.find((v) => v.userId === tile.identity)}
      member={contexto.members.find((m) => m.user.id === tile.identity)}
      roles={contexto.roles}
      canaisDeVoz={contexto.canaisDeVoz}
      minhasPermissoes={contexto.minhasPermissoes}
      currentUserId={contexto.currentUserId}
    >
      <div>{children}</div>
    </VoiceMemberMenu>
  );
};
