import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "~/traducao";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Accessibility,
  Bell,
  Code2,
  ChevronRight,
  Download,
  Languages,
  EyeOff,
  MessageSquare,
  Link2,
  Mic,
  Video,
  Palette,
  Pencil,
  Search,
  Server,
  User,
  X,
  LogOut,
} from "lucide-react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { AccountSection } from "~/components/user-settings/AccountSection";
import { AppearanceSection } from "~/components/user-settings/AppearanceSection";
import { NotificationsSection } from "~/components/user-settings/NotificationsSection";
import { VoiceSection } from "~/components/user-settings/VoiceSection";
import { ConexoesSection } from "~/components/user-settings/ConexoesSection";
import { BotsSection } from "~/components/user-settings/BotsSection";
import { AplicativoSection } from "~/components/user-settings/AplicativoSection";
import { AcessibilidadeSection } from "~/components/user-settings/AcessibilidadeSection";
import { IdiomaSection } from "~/components/user-settings/IdiomaSection";
import { BatePapoSection } from "~/components/user-settings/BatePapoSection";
import { PrivacidadeSection } from "~/components/user-settings/PrivacidadeSection";
import { ServidorSection } from "~/components/user-settings/ServidorSection";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { Input } from "~/components/ui/input";
import { ehDesktop } from "~/lib/desktop";
import { cn } from "~/lib/utils";
import {
  SUBSECOES,
  ancora,
  type Secao,
  type SubSecao,
} from "~/components/user-settings/secoes";
import { BotaoDeLink } from "~/components/user-settings/BotaoDeLink";
import { RodapeDeVersoes } from "~/components/user-settings/RodapeDeVersoes";
import { ContextoDaSecao } from "~/components/user-settings/SecaoDeConfig";
import { subSecaoAtiva } from "~/components/user-settings/espiao-da-rolagem";
import { useConfiguracoes } from "~/stores/configuracoes";

export type { Secao };

interface UserSettingsModalProps {
  open: boolean;
  user: SelfUserModel;
  onClose: () => void;
  onLogout: () => void;
  secaoInicial?: Secao;
  onEditarPerfil: () => void;
}

interface Item {
  id: Secao;
  /// Chave do catálogo, não texto. O mesmo motivo do `secoes.ts`: título de
  /// tela em português com a lateral em inglês seriam duas metades do mesmo
  /// modal em idiomas diferentes.
  chave: string;
  icone: React.ComponentType<{ size?: number | string; className?: string }>;
  subitens: SubSecao[];
}

/*
  Os itens em grupos, com o título de cada um.

  Uma lista corrida de sete linhas não diz o que é conta e o que é aparelho —
  e é justamente a divisão que a pessoa procura quando abre isto aqui.
*/
const gruposPara = (admin: boolean): { chave: string; itens: Item[] }[] => [
  {
    chave: "configuracoes.grupos.conta",
    itens: [
      {
        id: "conta",
        chave: "configuracoes.telas.conta",
        icone: User,
        subitens: SUBSECOES.conta,
      },
      {
        id: "privacidade",
        chave: "configuracoes.telas.privacidade",
        icone: EyeOff,
        subitens: SUBSECOES.privacidade,
      },
    ],
  },
  {
    chave: "configuracoes.grupos.app",
    itens: [
      {
        id: "aparencia",
        chave: "configuracoes.telas.aparencia",
        icone: Palette,
        subitens: SUBSECOES.aparencia,
      },
      {
        id: "bate-papo",
        chave: "configuracoes.telas.batePapo",
        icone: MessageSquare,
        subitens: SUBSECOES["bate-papo"],
      },
      /*
        Conexões fica com Privacidade e não com Perfil.

        Ela parece enfeite de perfil e não é: a pergunta que resolve é "o que
        eu conto de mim para quem me abre" — a mesma de Visibilidade do perfil,
        que está logo acima. Enfeite é como o nome é pintado; isto é o que ele
        entrega.
      */
      {
        id: "conexoes",
        chave: "configuracoes.telas.conexoes",
        icone: Link2,
        subitens: SUBSECOES.conexoes,
      },
      {
        id: "voz",
        chave: "configuracoes.telas.voz",
        icone: Mic,
        subitens: SUBSECOES.voz,
      },
      /*
        Vídeo em tela própria.

        Microfone e câmera se configuram em momentos diferentes — o microfone
        antes da primeira chamada, a câmera na primeira vez que alguém pede
        para te ver. Juntos faziam uma tela de seis seções em que a que
        interessa está sempre no meio da rolagem.
      */
      {
        id: "video",
        chave: "configuracoes.telas.video",
        icone: Video,
        subitens: SUBSECOES.video,
      },
      {
        id: "avisos",
        chave: "configuracoes.telas.avisos",
        icone: Bell,
        subitens: SUBSECOES.avisos,
      },
      {
        id: "acessibilidade",
        chave: "configuracoes.telas.acessibilidade",
        icone: Accessibility,
        subitens: SUBSECOES.acessibilidade,
      },
      {
        id: "idioma",
        chave: "configuracoes.telas.idioma",
        icone: Languages,
        subitens: SUBSECOES.idioma,
      },
      /// Some pra quem ja esta no app instalado: oferecer download a quem acabou
      /// de baixar e um convite pra lugar nenhum.
      ...(ehDesktop()
        ? []
        : [
            {
              id: "aplicativo" as const,
              chave: "configuracoes.telas.aplicativo",
              icone: Download,
              subitens: SUBSECOES.aplicativo,
            },
          ]),
    ],
  },
  /*
    O grupo de quem constrói em cima do Gravaê, separado das preferências.

    Aplicativo não é preferência de aparelho: ele existe no servidor, tem
    token e sobrevive à conta trocar de computador. Misturado com tema e som,
    estava no lugar errado da lista — e é o único item daqui que outra pessoa
    pode acabar usando.
  */
  {
    chave: "configuracoes.grupos.desenvolvedor",
    itens: [
      {
        id: "aplicativos" as const,
        chave: "configuracoes.telas.aplicativos",
        icone: Code2,
        subitens: SUBSECOES.aplicativos,
      },
    ],
  },
  /// Esconder o item é conforto, não segurança: quem decide é a API, que
  /// devolve 404 na rota pra qualquer conta fora da lista.
  ...(admin
    ? [
        {
          chave: "configuracoes.grupos.administracao",
          itens: [
            {
              id: "servidor" as const,
              chave: "configuracoes.telas.servidor",
              icone: Server,
              subitens: SUBSECOES.servidor,
            },
          ],
        },
      ]
    : []),
];

/*
  O título de cada tela, por chave.

  Existe separado da lista de itens porque nem toda tela está na lista: "Baixar
  o app" some do menu no aplicativo instalado, e a de servidor só aparece para
  quem administra. O cabeçalho precisa saber o nome de todas.
*/
const TITULOS: Record<Secao, string> = {
  conta: "configuracoes.telas.conta",
  privacidade: "configuracoes.telas.privacidade",
  conexoes: "configuracoes.telas.conexoes",
  voz: "configuracoes.telas.voz",
  video: "configuracoes.telas.video",
  avisos: "configuracoes.telas.avisos",
  aplicativos: "configuracoes.telas.aplicativos",
  aparencia: "configuracoes.telas.aparencia",
  "bate-papo": "configuracoes.telas.batePapo",
  acessibilidade: "configuracoes.telas.acessibilidade",
  idioma: "configuracoes.telas.idioma",
  aplicativo: "configuracoes.telas.aplicativo",
  servidor: "configuracoes.telas.servidor",
};

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  open,
  user,
  onClose,
  onLogout,
  secaoInicial = "conta",
  onEditarPerfil,
}) => {
  const { t } = useTranslation();
  const [secao, setSecao] = useState<Secao>(secaoInicial);
  const [busca, setBusca] = useState("");
  const [subAtiva, setSubAtiva] = useState<string | null>(null);
  const rolagem = useRef<HTMLDivElement>(null);

  /*
    A busca corta itens E sub-itens.

    Procurar "qualidade" precisa achar a seção lá dentro de Voz e vídeo — é
    justamente o que a pessoa não encontra sozinha, e o motivo de existir uma
    busca numa lista de sete linhas. Item cujo próprio nome casa mantém a lista
    inteira de sub-itens; grupo que ficou sem item some junto.
  */
  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const todos = gruposPara(user.admin);
    if (!termo) return todos;

    return todos
      .map((grupo) => ({
        ...grupo,
        itens: grupo.itens
          .map((item) => {
            const casaOItem = t(item.chave).toLowerCase().includes(termo);
            const subitens = casaOItem
              ? item.subitens
              : item.subitens.filter((sub) =>
                  t(sub.chave).toLowerCase().includes(termo),
                );

            return { ...item, subitens };
          })
          .filter(
            (item) =>
              t(item.chave).toLowerCase().includes(termo) ||
              item.subitens.length > 0,
          ),
      }))
      .filter((grupo) => grupo.itens.length > 0);
  }, [busca, user.admin, t]);

  /*
    Trocar de tela volta a leitura pro alto e acende a PRIMEIRA seção.

    Zerar deixava a árvore aberta sem nada marcado até a primeira rolagem — e
    quem abre uma tela e não rola nunca via o fio aceso, como se a lateral
    estivesse quebrada. Acender a primeira também é verdade: é onde a leitura
    começa.
  */
  useEffect(() => {
    setSubAtiva(SUBSECOES[secao][0]?.id ?? null);
    rolagem.current?.scrollTo({ top: 0 });
  }, [secao]);

  /*
    A seção escolhida no clique, protegida da rolagem.

    Sem isto, clicar num sub-item acendia a seção certa por um instante e a
    lateral pulava de volta: a rolagem suave dispara o `onScroll` dezenas de
    vezes no caminho, e o último disparo mandava. Pior no fim da lista, onde a
    tela não tem quanto rolar — a seção pedida nunca chega à linha de leitura,
    e a marca voltava para a de cima como se o clique não tivesse funcionado.
  */
  const escolhaManual = useRef<string | null>(null);

  const irPara = useCallback((secaoDestino: Secao, sub: string) => {
    setSecao(secaoDestino);
    setSubAtiva(sub);
    escolhaManual.current = sub;

    /*
      No quadro seguinte: quando a tela muda junto, a seção de destino ainda
      não existe no DOM na hora do clique, e o `scrollIntoView` não acharia
      nada. Um quadro é o suficiente porque o React já pintou.
    */
    requestAnimationFrame(() => {
      document
        .getElementById(ancora(sub))
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }, []);

  /*
    A tela e a seção que o link pediu.

    `secao` nasce de `secaoInicial`, mas nascer não basta: o modal continua
    montado depois de fechado, então abrir duas vezes seguidas em telas
    diferentes deixaria a segunda na tela da primeira. E a sub-seção é
    consumida — trocar de tela e voltar não pode pular de novo pra lá.
  */
  const subInicial = useConfiguracoes((s) => s.subInicial);
  const consumirSubInicial = useConfiguracoes((s) => s.consumirSubInicial);

  useEffect(() => {
    if (!open) return;

    setSecao(secaoInicial);
    if (!subInicial) return;

    irPara(secaoInicial, subInicial);
    consumirSubInicial();
  }, [open, secaoInicial, subInicial, irPara, consumirSubInicial]);

  /// Rolar de verdade — roda, dedo ou teclado — devolve o comando ao espião.
  const soltarEscolha = useCallback(() => {
    escolhaManual.current = null;
  }, []);

  /*
    Qual seção está sendo lida.

    Vale a ÚLTIMA cujo topo já passou da linha de leitura, e não a primeira
    visível: rolando devagar, as duas aparecem juntas por um bom tempo, e a
    lateral ficaria oscilando entre elas. A linha fica um pouco abaixo do topo
    do painel, onde o olho de fato está.
  */
  const aoRolar = useCallback(() => {
    const painel = rolagem.current;
    if (!painel) return;

    /*
      Enquanto a escolha do clique estiver de pé, quem manda é o clique.

      Ela cai quando VOCÊ rola — roda do mouse, dedo, teclado —, e não depois
      de um tempo. Prazo não serve: a rolagem suave pode demorar mais que ele
      num painel longo, e seção curta no pé da lista nunca chega à linha de
      leitura, então o relógio a devolveria pra anterior sozinho.
    */
    if (escolhaManual.current) return;

    const secoes = SUBSECOES[secao];
    const topoDoPainel = painel.getBoundingClientRect().top;

    setSubAtiva(
      subSecaoAtiva({
        ancoras: secoes.flatMap((sub) => {
          const alvo = document.getElementById(ancora(sub.id));
          return alvo ? [{ id: sub.id, topo: alvo.getBoundingClientRect().top - topoDoPainel }] : [];
        }),
        /// A linha fica um pouco abaixo do topo do painel, onde o olho de fato
        /// está — não na borda, onde o texto ainda está entrando.
        linha: 80,
        rolagemTotal: painel.scrollHeight - painel.clientHeight,
      }),
    );
  }, [secao]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
        {/*
          Janela grande e centrada, não uma caixinha no meio da tela: quase
          toda seção daqui é lista longa — dispositivos de áudio, avisos por
          servidor, temas — e a caixa de antes (896px de largura, 80% de
          altura) obrigava a rolar pra ver três linhas de cada vez.
        */}
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 flex h-[min(60rem,92vh)] w-[min(87.5rem,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-surface-1 shadow-2xl outline-none"
          aria-label="Configurações do usuário"
        >
          <DialogPrimitive.Title className="sr-only">
            Configurações do usuário
          </DialogPrimitive.Title>

          {/*
            Barra lateral MAIS CLARA que o conteúdo, e não mais escura.

            É a inversão que a referência faz e que dá o desenho: a navegação
            sobe pra cor de menu (`surface-4`) e o conteúdo desce pra cor de
            barra lateral (`surface-1`). Antes as duas colunas eram `surface-1`
            e `surface-2` — dois quase-pretos separados por 4 pontos de brilho,
            e a janela lia como um bloco só.

            A largura acompanha a janela em vez de ser fixa: numa tela estreita
            a lateral não pode comer o conteúdo, e numa larga não pode virar
            uma tira de rótulos truncados.
          */}
          <nav className="flex w-[max(15.75rem,min(24svw,20rem))] shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface-4 px-3 pb-0 pt-4">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar configurações"
                aria-label="Pesquisar configurações"
                className="h-9 border-transparent pl-8 text-sm shadow-none focus-visible:border-white/15 focus-visible:ring-0"
              />
            </div>

            <button
              onClick={onEditarPerfil}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-hover"
            >
              <Avatar
                id={user.id}
                name={user.displayName}
                url={user.avatarUrl}
                size={36}
                enfeites={user.perfil}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {user.displayName}
                </span>
                <span className="flex items-center gap-1 text-xs text-ink-muted">
                  Editar perfil <Pencil size={11} />
                </span>
              </span>
            </button>

            <div className="flex flex-col gap-2">
              {grupos.map((grupo) => (
                <div key={grupo.chave} className="flex flex-col gap-[3px]">
                  <p className="truncate px-2.5 pb-[3px] pt-1 text-11 font-semibold uppercase leading-4 tracking-[0.02em] text-ink-faint">
                    {t(grupo.chave)}
                  </p>

                  {grupo.itens.map((item) => (
                    <ItemDaLateral
                      key={item.id}
                      item={item}
                      ativo={secao === item.id}
                      subAtiva={secao === item.id ? subAtiva : null}
                      onEscolher={() => setSecao(item.id)}
                      onEscolherSub={(sub) => irPara(item.id, sub)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {!grupos.length && (
              <p className="px-2 text-xs text-ink-faint">
                Nada com esse nome por aqui.
              </p>
            )}

            {/*
              Sair e as versões, no pé — e fora do filtro da busca.

              Sair já existe dentro da tela de Conta, e continua lá: quem vai
              deliberadamente encerrar a sessão passa pelo lugar onde estão as
              sessões e os aparelhos. Aqui é o outro gesto, o de quem quer
              apenas sair e não quer caçar onde. Duas portas para a mesma ação
              não são duplicidade quando os caminhos até elas são diferentes.

              `mt-auto` empurra o bloco para baixo mesmo com a lista curta, e o
              `pb-3` existe porque a `<nav>` tem `pb-0` — sem ele o rodapé
              encosta na borda da janela.
            */}
            <div className="mt-auto flex flex-col pb-3 pt-2">
              <button
                onClick={onLogout}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-danger transition hover:bg-danger/10"
              >
                <LogOut size={16} className="shrink-0" />
                {t("configuracoes.sair")}
              </button>

              <RodapeDeVersoes />
            </div>
          </nav>

          {/*
            O título da seção mora numa barra fixa, com o X ao lado: antes cada
            seção repetia o próprio nome lá dentro e o X flutuava por cima do
            conteúdo, encostando no que estivesse no canto.
          */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-15 shrink-0 items-center justify-between gap-4 border-b border-line px-4">
              <h2 className="group/titulo flex min-w-0 items-center gap-1.5 text-lg font-semibold">
                <span className="truncate">{t(TITULOS[secao])}</span>
                <BotaoDeLink secao={secao} oQue="esta página" />
              </h2>

              <DialogPrimitive.Close
                aria-label="Fechar"
                className="flex size-[34px] shrink-0 items-center justify-center rounded-lg text-ink-faint transition hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                <X size={20} />
              </DialogPrimitive.Close>
            </div>

            {/*
              A coluna de leitura tem teto e é centrada.

              Sem isto o conteúdo se esparramava por toda a largura da janela:
              numa janela de 1240px sobravam quase 400px de vazio à direita, e
              cada linha de texto atravessava a tela inteira — largura em que
              o olho perde a volta da linha. O teto cresce com a janela, mas
              para: `max(40rem, min(90%, 50rem))`.
            */}
            <div
              ref={rolagem}
              onScroll={aoRolar}
              onWheel={soltarEscolha}
              onTouchMove={soltarEscolha}
              onKeyDown={soltarEscolha}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <div className="mx-auto w-full max-w-[max(40rem,min(90%,50rem))] px-[clamp(1rem,3vw,1.5rem)] pb-8 pt-5">
                {/*
                  Caixa por seção, e a chave é o `secao`: uma tela de configuração
                  que quebra mostra um cartão no lugar dela, e trocar de seção já
                  limpa o estrago. Sem isso, o painel de servidor tropeçando num
                  formato inesperado da API levava a aplicação inteira junto.
                */}
                <ContextoDaSecao.Provider value={secao}>
                  <ErrorBoundary
                    key={secao}
                    onde={`configurações · ${secao}`}
                    compacto
                  >
                    {secao === "conta" && (
                      <AccountSection user={user} onLogout={onLogout} />
                    )}
                    {secao === "privacidade" && (
                      <PrivacidadeSection user={user} />
                    )}
                    {secao === "conexoes" && <ConexoesSection user={user} />}
                    {secao === "voz" && <VoiceSection parte="audio" />}
                    {secao === "video" && <VoiceSection parte="video" />}
                    {secao === "avisos" && <NotificationsSection />}
                    {secao === "aplicativos" && <BotsSection />}

                    {secao === "aparencia" && <AppearanceSection />}
                    {secao === "bate-papo" && <BatePapoSection />}
                    {secao === "acessibilidade" && <AcessibilidadeSection />}
                    {secao === "idioma" && <IdiomaSection />}
                    {secao === "aplicativo" && <AplicativoSection />}
                    {secao === "servidor" && user.admin && <ServidorSection />}
                  </ErrorBoundary>
                </ContextoDaSecao.Provider>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

interface ItemDaLateralProps {
  item: Item;
  ativo: boolean;
  subAtiva: string | null;
  onEscolher: () => void;
  onEscolherSub: (sub: string) => void;
}

/*
  Um item da lateral, com a sua árvore de seções.

  A tela aberta abre a árvore, e não um botão de expandir separado: as duas
  coisas são a mesma pergunta — "estou nesta tela" —, e separá-las deixaria
  abrir uma árvore de uma tela que não se está vendo, apontando seções que não
  existem na página.
*/
const ItemDaLateral: React.FC<ItemDaLateralProps> = ({
  item,
  ativo,
  subAtiva,
  onEscolher,
  onEscolherSub,
}) => {
  const { t } = useTranslation();
  const lista = useRef<HTMLDivElement>(null);

  /*
    Mede o sub-item aceso e entrega a posição ao CSS.

    `useLayoutEffect` e não `useEffect`: medir depois da pintura faria o fio
    saltar da posição antiga pra nova à vista de todos, no primeiro quadro.
  */
  useLayoutEffect(() => {
    const el = lista.current;
    if (!el) return;

    const marcado = el.querySelector<HTMLElement>('[data-ativo="true"]');

    if (!marcado) {
      el.removeAttribute("data-tem-ativo");
      return;
    }

    el.setAttribute("data-tem-ativo", "true");
    el.style.setProperty("--active-top", `${marcado.offsetTop}px`);
    el.style.setProperty("--active-height", `${marcado.offsetHeight}px`);
  }, [subAtiva, ativo, item.subitens]);

  const temSub = item.subitens.length > 0;

  return (
    <div className="flex flex-col">
      <button
        onClick={onEscolher}
        aria-current={ativo}
        aria-expanded={temSub ? ativo : undefined}
        className={cn(
          /*
            A borda de 1px existe SEMPRE, transparente. Aparecendo só no ativo,
            o item ganharia 2px de altura ao ser escolhido e a lista inteira
            andaria um pouco a cada clique.
          */
          "flex w-full items-center gap-2 rounded-lg border px-2.5 py-[5px] text-left text-sm transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
          /*
            Só o véu branco a 10%, SEM cor de borda. A referência declara um
            `--settings-selected-border-color` e não o usa aqui: nem o item
            nem o sub-item acesos ganham borda visível. A de 1px transparente
            fica só pela altura, pra lista não andar a cada clique.
          */
          ativo
            ? "border-transparent bg-selecionado font-medium text-ink"
            : "border-transparent text-ink-muted hover:bg-hover hover:text-ink",
        )}
      >
        {/*
          O ícone é o que deixa a lista percorrível de relance — sete rótulos
          alinhados só se leem palavra por palavra. Ele acende junto com o
          item, senão vira ruído cinza.
        */}
        <item.icone
          size={20}
          className={cn(
            "shrink-0 transition",
            ativo ? "text-ink" : "text-ink-faint",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{t(item.chave)}</span>

        {temSub && (
          <ChevronRight
            size={14}
            className={cn(
              "shrink-0 transition-transform duration-200 motion-reduce:transition-none",
              ativo ? "rotate-90 text-ink" : "text-ink-faint",
            )}
          />
        )}
      </button>

      {temSub && (
        /*
          Abre e fecha por `grid-template-rows`, de `0fr` a `1fr`. É o único
          jeito de animar até a altura do conteúdo sem saber a altura: com
          `max-height` chutada, uma árvore mais curta fecharia com atraso e uma
          mais longa seria cortada.
        */
        <div
          className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
          style={{ gridTemplateRows: ativo ? "1fr" : "0fr" }}
          aria-hidden={!ativo}
        >
          <div className="overflow-hidden">
            {/*
              As margens saem das medidas da referência: o fio nasce alinhado ao
              centro do ícone do item de cima (21px), e o rótulo do sub-item
              alinha com o rótulo do item (mais 7px).
            */}
            <div
              ref={lista}
              className="subarvore-de-config ml-[21px] mt-[3px] flex flex-col gap-0.5 pl-[7px]"
            >
              {item.subitens.map((sub) => (
                <button
                  key={sub.id}
                  data-ativo={subAtiva === sub.id}
                  tabIndex={ativo ? 0 : -1}
                  onClick={() => onEscolherSub(sub.id)}
                  className={cn(
                    "relative z-10 truncate rounded-md border px-2.5 py-1 text-left text-13 transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                    subAtiva === sub.id
                      ? "border-transparent bg-selecionado font-semibold text-ink"
                      : "border-transparent text-ink-faint hover:bg-hover hover:text-ink-muted",
                  )}
                >
                  {t(sub.chave)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
