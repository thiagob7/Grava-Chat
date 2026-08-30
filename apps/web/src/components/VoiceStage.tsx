import React, { useEffect, useRef, useState } from "react";
import { Maximize, Mic, MicOff, Minimize, Monitor, MonitorUp, Play, SignalLow, Volume2, VolumeX, X } from "lucide-react";

import { QualidadeDaTela } from "~/components/QualidadeDaTela";

import type {
  Channel,
  GuildMember,
  Permission,
  Role,
  VoiceState,
} from "@gravae/shared";

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
import { cn } from "~/lib/utils";

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
}

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
}) => {
  const palco = useRef<HTMLDivElement>(null);
  const quadro = useRef<HTMLDivElement>(null);
  /// qual quadro está em destaque; `null` é a grade igualitária
  const [focado, setFocado] = useState<string | null>(null);

  /*
    Tela cheia no QUADRO, não na janela inteira: assim a barra de participantes
    e o resto do app somem, e o vídeo ocupa o monitor.
  */
  const telaCheia = useTelaCheia(quadro);
  const tiles = useVoiceStore((s) => s.tiles);
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
        <p className="font-medium text-danger">Não deu pra entrar na chamada</p>
        <p className="max-w-sm text-sm text-ink-muted">{error}</p>
      </div>
    );
  }

  if (connecting) {
    return (
      <div className="flex flex-1 items-center justify-center text-ink-muted">
        Conectando à chamada…
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
          <VoiceVideo track={sharing.screenTrack!} />

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

            <span className="ml-auto rounded bg-danger px-1.5 py-0.5 text-[10px] font-bold tracking-wide">
              AO VIVO
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
              <X size={14} /> Parar de assistir
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

        <VoiceStageControls alvoTelaCheia={palco} />
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
          onFocar={() => setFocado((atual) => (atual === quadro.key ? null : quadro.key))}
        />
      </ComMenu>
    );

  /*
    Clicar num quadro destaca ele e joga o resto numa faixa embaixo — clicar de
    novo desfaz. A grade igualitária dá o mesmo espaço pra todo mundo mesmo
    quando só uma pessoa interessa naquele instante; o foco é o que resolve.
  */
  if (emFoco) {
    return (
      /*
        `pb-20`, e não `p-4` nos quatro lados.

        A pílula de controles é ancorada em `bottom-4` do palco e tem ~52px:
        ocupa de 16 a 68px do rodapé — exatamente onde a faixa de quadros
        pequenos ficava. O resultado era a miniatura da live escondida atrás dos
        botões, com metade dela aparecendo pelas bordas.
      */
      <div ref={palco} className="group relative flex flex-1 flex-col gap-3 bg-surface-2 p-4 pb-20">
        {/*
          O quadro em destaque PREENCHE. Sem isso ele mantém o 16:9 dentro de
          uma caixa mais alta, e sobra uma tira preta entre ele e a faixa — o
          mesmo defeito que aparecia com uma pessoa só na chamada.
        */}
        <div className="min-h-0 flex-1 [&>*]:size-full">
          {desenhar(emFoco.destaque, false, true)}
        </div>

        <div className="flex shrink-0 justify-center gap-2">
          {emFoco.faixa.map((quadro) => (
            <div key={quadro.key} className="w-40 shrink-0">
              {desenhar(quadro, true)}
            </div>
          ))}
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

        <VoiceStageControls alvoTelaCheia={palco} />
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
        {grade.map((quadro) =>
          quadro.tipo === "tela" ? (
            <TileDaLive
              key={quadro.key}
              tile={quadro.de.tile}
              denso
              onAssistir={() => setAssistindo(quadro.de.identity)}
              className="h-24 shrink-0"
            />
          ) : (
            <ComMenu key={quadro.key} tile={quadro.de.tile} contexto={contexto}>
              <RostoNaChamada tile={quadro.de.tile} guildId={guildId} />
            </ComMenu>
          ),
        )}

        {!tiles.length && <p className="text-ink-muted">Ninguém em {channelName} ainda.</p>}

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

        <VoiceStageControls alvoTelaCheia={palco} />
      </div>
    );
  }

  return (
    <div
      ref={palco}
      className={cn(
        "group relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-surface-2",
        /*
          Sozinho na chamada, o quadro ocupa a área inteira.

          A margem e o teto de largura existem pra grade não virar uma parede de
          quadros gigantes quando há gente. Com UM quadro só eles não protegem
          nada — só deixam um retângulo pequeno no meio de um vazio enorme, que
          é o que aparecia quando alguém entrava primeiro e esperava os outros.
        */
        /*
          `pb-20` com mais de um quadro: a pílula de controles é ancorada em
          `bottom-4` do palco e tem ~52px, ocupando de 16 a 68px do rodapé. Sem
          a folga ela pousa em cima do quadro de baixo — foi o que aconteceu com
          a miniatura da live, que ficava metade escondida atrás dos botões.

          Com um quadro só a folga não existe de propósito: ali o vídeo vai de
          ponta a ponta e a pílula flutua por cima, como numa chamada de vídeo.
        */
        grade.length === 1 ? "p-0" : "p-6 pb-20",
      )}
    >
      {/*
        `min-h-0` e `overflow-hidden` acima, `max-h-full` aqui: sem os três, a
        grade cresce além da altura reservada e vaza pra fora do palco. Numa
        conversa privada isso aparecia como os quadros da chamada sobrepondo o
        cabeçalho da conversa, com o nome de quem escreveu no meio deles.
      */}
      <div
        className={cn(
          "grid size-full max-h-full gap-4",
          grade.length > 1 && "max-w-5xl",
          /// o `div` que o menu de contexto põe em volta também precisa esticar,
          /// senão o quadro cresce dentro de uma caixa do tamanho antigo
          grade.length === 1 && "[&>*]:size-full",
        )}
        style={{
          gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))`,
          /// Só no caso de um quadro: com vários, esticar a linha estouraria o
          /// 16:9 de cada um.
          ...(grade.length === 1 ? { gridAutoRows: "minmax(0, 1fr)" } : {}),
        }}
      >
        {grade.map((quadro) => desenhar(quadro, false, grade.length === 1))}
      </div>
      {!tiles.length && (
        <p className="text-ink-muted">Ninguém em {channelName} ainda.</p>
      )}

      <VoiceStageControls alvoTelaCheia={palco} />
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
  /// clicar no quadro alterna o modo destaque
  onFocar?: () => void;
}

const Tile: React.FC<TileProps> = ({ tile, guildId, compact, denso, preencher, onFocar }) => {
  const resolver = useParticipante();
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
        "group/tile relative flex items-center justify-center overflow-hidden rounded-lg bg-surface-1 transition",
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
        <div className={cn("size-full", tile.speaking && "ring-2 ring-online")}>
          <VoiceVideo track={tile.cameraTrack} mirrored={tile.isLocal} />
        </div>
      ) : (
        <Avatar
          id={tile.identity}
          name={participante.nome}
          url={participante.avatarUrl}
          size={compact ? 44 : denso ? 52 : 80}
          enfeites={participante.perfil}
          animar={tile.speaking}
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
                ? "w-0 overflow-hidden text-[10px] opacity-0 transition-all group-hover/tile:w-auto group-hover/tile:opacity-100"
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
}> = ({ tile, denso, onAssistir, className }) => (
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

        <span className="pointer-events-none absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          <span className="size-1.5 animate-pulse rounded-full bg-white" /> Ao vivo
        </span>
      </button>
    ) : (
      <button
        onClick={onAssistir}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition hover:bg-white/5"
      >
        <span className="flex items-center gap-1.5 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          <span className="size-1.5 animate-pulse rounded-full bg-white" /> Ao vivo
        </span>

        <span className={cn("flex items-center gap-1.5 font-medium", denso ? "text-xs" : "text-sm")}>
          <Play size={denso ? 14 : 16} /> Assistir a {tile.name}
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
 * Uma pessoa na chamada de privado: o rosto, e só.
 *
 * Sem quadro em volta e sem etiqueta fixa. São duas pessoas numa conversa —
 * quem está ali já se sabe, e desenhar caixa e nome em volta de cada uma gasta
 * a altura que a conversa precisa pra dizer o que ninguém ainda sabe.
 *
 * O anel de "falando" e o microfone cortado continuam, porque esses mudam.
 */
const RostoNaChamada: React.FC<{ tile: VoiceTile; guildId?: string }> = ({ tile, guildId }) => {
  const resolver = useParticipante();
  const participante = resolver(tile.identity, { name: tile.name, avatarUrl: tile.avatarUrl });

  return (
    <div className="group/rosto flex flex-col items-center gap-2">
      <div className="relative">
        {tile.cameraTrack ? (
          <div className="size-20 overflow-hidden rounded-full ring-2 ring-transparent">
            <VoiceVideo track={tile.cameraTrack} mirrored={tile.isLocal} />
          </div>
        ) : (
          <Avatar
            id={tile.identity}
            name={participante.nome}
            url={participante.avatarUrl}
            size={80}
            enfeites={participante.perfil}
            animar={tile.speaking}
          />
        )}

        {!tile.micEnabled && (
          <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full bg-surface-0 ring-2 ring-surface-2">
            <MicOff size={12} className="text-danger" />
          </span>
        )}
      </div>

      <UserProfilePopover userId={tile.identity} guildId={guildId} side="top">
        <button className="max-w-28 truncate text-xs font-medium text-ink-muted hover:underline">
          {participante.nome}
          {tile.isLocal && " (você)"}
        </button>
      </UserProfilePopover>
    </div>
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
  const resolver = useParticipante();
  const participante = resolver(tile.identity, { name: tile.name, avatarUrl: tile.avatarUrl });

  return (
    <div className="relative shrink-0" title={participante.nome}>
      {tile.cameraTrack ? (
        <div className="size-11 overflow-hidden rounded-full">
          <VoiceVideo track={tile.cameraTrack} mirrored={tile.isLocal} />
        </div>
      ) : (
        <Avatar
          id={tile.identity}
          name={participante.nome}
          url={participante.avatarUrl}
          size={44}
          enfeites={participante.perfil}
          animar={tile.speaking}
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
