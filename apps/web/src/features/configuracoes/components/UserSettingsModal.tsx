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
  Keyboard,
  Languages,
  EyeOff,
  MonitorCog,
  MessageSquare,
  Link2,
  Mic,
  Video,
  Palette,
  Pencil,
  Search,
  Server,
  SlidersHorizontal,
  User,
  X,
  LogOut,
} from "lucide-react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { AccountSection } from "~/features/configuracoes/components/AccountSection";
import { AppearanceSection } from "~/features/configuracoes/components/AppearanceSection";
import { NotificationsSection } from "~/features/configuracoes/components/NotificationsSection";
import { VoiceSection } from "~/features/configuracoes/components/VoiceSection";
import { ConexoesSection } from "~/features/configuracoes/components/ConexoesSection";
import { AplicativosSection } from "~/features/configuracoes/components/aplicativos/AplicativosSection";
import { AtalhosSection } from "~/features/configuracoes/components/AtalhosSection";
import { DesktopSection } from "~/features/configuracoes/components/DesktopSection";
import { AvancadoSection } from "~/features/configuracoes/components/AvancadoSection";
import { AplicativoSection } from "~/features/configuracoes/components/AplicativoSection";
import { AcessibilidadeSection } from "~/features/configuracoes/components/AcessibilidadeSection";
import { IdiomaSection } from "~/features/configuracoes/components/IdiomaSection";
import { BatePapoSection } from "~/features/configuracoes/components/BatePapoSection";
import { PrivacidadeSection } from "~/features/configuracoes/components/PrivacidadeSection";
import { ServidorSection } from "~/features/configuracoes/components/ServidorSection";
import { ErrorBoundary } from "~/features/app/components/ErrorBoundary";
import { Input } from "~/components/ui/input";
import { ehDesktop } from "~/lib/desktop";
import { cn } from "~/lib/utils";
import {
  SUBSECOES,
  ancora,
  type Secao,
  type SubSecao,
} from "~/features/configuracoes/components/secoes";
import { BotaoDeLink } from "~/features/configuracoes/components/BotaoDeLink";
import { RodapeDeVersoes } from "~/features/configuracoes/components/RodapeDeVersoes";
import { ContextoDaSecao } from "~/features/configuracoes/components/SecaoDeConfig";
import { subSecaoAtiva } from "~/features/configuracoes/components/espiao-da-rolagem";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";

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
  chave: string;
  icone: React.ComponentType<{ size?: number | string; className?: string }>;
  subitens: SubSecao[];
}

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
      {
        id: "atalhos" as const,
        chave: "configuracoes.telas.atalhos",
        icone: Keyboard,
        subitens: SUBSECOES.atalhos,
      },
      ...(ehDesktop()
        ? [
            {
              id: "desktop" as const,
              chave: "configuracoes.telas.desktop",
              icone: MonitorCog,
              subitens: SUBSECOES.desktop,
            },
          ]
        : [
            {
              id: "aplicativo" as const,
              chave: "configuracoes.telas.aplicativo",
              icone: Download,
              subitens: SUBSECOES.aplicativo,
            },
          ]),
      {
        id: "avancado" as const,
        chave: "configuracoes.telas.avancado",
        icone: SlidersHorizontal,
        subitens: SUBSECOES.avancado,
      },
    ],
  },
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
  desktop: "configuracoes.telas.desktop",
  atalhos: "configuracoes.telas.atalhos",
  avancado: "configuracoes.telas.avancado",
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

  useEffect(() => {
    setSubAtiva(SUBSECOES[secao][0]?.id ?? null);
    rolagem.current?.scrollTo({ top: 0 });
  }, [secao]);

  const escolhaManual = useRef<string | null>(null);

  const irPara = useCallback((secaoDestino: Secao, sub: string) => {
    setSecao(secaoDestino);
    setSubAtiva(sub);
    escolhaManual.current = sub;

    requestAnimationFrame(() => {
      document
        .getElementById(ancora(sub))
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }, []);

  const subInicial = useConfiguracoes((s) => s.subInicial);
  const consumirSubInicial = useConfiguracoes((s) => s.consumirSubInicial);

  useEffect(() => {
    if (!open) return;

    setSecao(secaoInicial);
    if (!subInicial) return;

    irPara(secaoInicial, subInicial);
    consumirSubInicial();
  }, [open, secaoInicial, subInicial, irPara, consumirSubInicial]);

  const soltarEscolha = useCallback(() => {
    escolhaManual.current = null;
  }, []);

  const aoRolar = useCallback(() => {
    const painel = rolagem.current;
    if (!painel) return;

    if (escolhaManual.current) return;

    const secoes = SUBSECOES[secao];
    const topoDoPainel = painel.getBoundingClientRect().top;

    setSubAtiva(
      subSecaoAtiva({
        ancoras: secoes.flatMap((sub) => {
          const alvo = document.getElementById(ancora(sub.id));
          return alvo ? [{ id: sub.id, topo: alvo.getBoundingClientRect().top - topoDoPainel }] : [];
        }),
        linha: 80,
        rolagemTotal: painel.scrollHeight - painel.clientHeight,
      }),
    );
  }, [secao]);

  return (
    <DialogPrimitive.Root data-gc="configuracoes.user-settings-modal.dialog-primitiveroot"
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay data-gc="configuracoes.user-settings-modal.dialog-primitiveoverlay" className="fixed inset-0 z-50 bg-black/70" />
        <DialogPrimitive.Content data-gc="configuracoes.user-settings-modal.dialog-primitivecontent"
          className="regiao-sem-arrasto fixed inset-0 z-50 m-auto flex h-[min(60rem,92vh)] w-[min(87.5rem,94vw)] overflow-hidden rounded-xl bg-surface-1 shadow-2xl outline-none"
          aria-label="Configurações do usuário"
        >
          <DialogPrimitive.Title data-gc="configuracoes.user-settings-modal.dialog-primitivetitle" className="sr-only">
            Configurações do usuário
          </DialogPrimitive.Title>

          <nav data-gc="configuracoes.user-settings-modal.nav" className="flex w-[max(15.75rem,min(24svw,20rem))] shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface-4 px-3 pb-0 pt-4">
            <div data-gc="configuracoes.user-settings-modal.div" className="relative">
              <Search data-gc="configuracoes.user-settings-modal.search"
                size={15}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <Input data-gc="configuracoes.user-settings-modal.input"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar configurações"
                aria-label="Pesquisar configurações"
                className="h-9 border-transparent pl-8 text-sm shadow-none focus-visible:border-white/15 focus-visible:ring-0"
              />
            </div>

            <button data-gc="configuracoes.user-settings-modal.button.on-editar-perfil"
              onClick={onEditarPerfil}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-hover"
            >
              <Avatar data-gc="configuracoes.user-settings-modal.avatar"
                id={user.id}
                name={user.displayName}
                url={user.avatarUrl}
                size={36}
                enfeites={user.perfil}
              />
              <span data-gc="configuracoes.user-settings-modal.span" className="min-w-0 flex-1">
                <span data-gc="configuracoes.user-settings-modal.span--2" className="block truncate text-sm font-semibold">
                  {user.displayName}
                </span>
                <span data-gc="configuracoes.user-settings-modal.span--3" className="flex items-center gap-1 text-xs text-ink-muted">
                  Editar perfil <Pencil data-gc="configuracoes.user-settings-modal.pencil" size={11} />
                </span>
              </span>
            </button>

            <div data-gc="configuracoes.user-settings-modal.div--2" className="flex flex-col gap-2">
              {grupos.map((grupo) => (
                <div data-gc="configuracoes.user-settings-modal.div--3" key={grupo.chave} className="flex flex-col gap-[3px]">
                  <p data-gc="configuracoes.user-settings-modal.p" className="truncate px-2.5 pb-[3px] pt-1 text-11 font-semibold uppercase leading-4 tracking-[0.02em] text-ink-faint">
                    {t(grupo.chave)}
                  </p>

                  {grupo.itens.map((item) => (
                    <ItemDaLateral data-gc="configuracoes.user-settings-modal.item-da-lateral"
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
              <p data-gc="configuracoes.user-settings-modal.p--2" className="px-2 text-xs text-ink-faint">
                Nada com esse nome por aqui.
              </p>
            )}

            <div data-gc="configuracoes.user-settings-modal.div--4" className="mt-auto flex flex-col pb-3 pt-2">
              <button data-gc="configuracoes.user-settings-modal.button.on-logout"
                onClick={onLogout}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-danger transition hover:bg-danger/10"
              >
                <LogOut data-gc="configuracoes.user-settings-modal.log-out" size={16} className="shrink-0" />
                {t("configuracoes.sair")}
              </button>

              <ErrorBoundary onde="configurações · versões" compacto>
                <RodapeDeVersoes data-gc="configuracoes.user-settings-modal.rodape-de-versoes" />
              </ErrorBoundary>
            </div>
          </nav>

          <div data-gc="configuracoes.user-settings-modal.div--5" className="flex min-w-0 flex-1 flex-col">
            <div data-gc="configuracoes.user-settings-modal.div--6" className="flex h-15 shrink-0 items-center justify-between gap-4 border-b border-line px-4">
              <h2 data-gc="configuracoes.user-settings-modal.h2" className="group/titulo flex min-w-0 items-center gap-1.5 text-lg font-semibold">
                <span data-gc="configuracoes.user-settings-modal.span--4" className="truncate">{t(TITULOS[secao])}</span>
                <BotaoDeLink data-gc="configuracoes.user-settings-modal.botao-de-link" secao={secao} oQue="esta página" />
              </h2>

              <DialogPrimitive.Close
                aria-label="Fechar"
                className="flex size-[34px] shrink-0 items-center justify-center rounded-lg text-ink-faint transition hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                <X data-gc="configuracoes.user-settings-modal.x" size={20} />
              </DialogPrimitive.Close>
            </div>

            <div data-gc="configuracoes.user-settings-modal.div.ao-rolar"
              ref={rolagem}
              onScroll={aoRolar}
              onWheel={soltarEscolha}
              onTouchMove={soltarEscolha}
              onKeyDown={soltarEscolha}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <div data-gc="configuracoes.user-settings-modal.div--7" className="mx-auto w-full max-w-[max(40rem,min(90%,50rem))] px-[clamp(1rem,3vw,1.5rem)] pb-8 pt-5">
                <ContextoDaSecao.Provider value={secao}>
                  <ErrorBoundary
                    key={secao}
                    onde={`configurações · ${secao}`}
                    compacto
                  >
                    {secao === "conta" && (
                      <AccountSection data-gc="configuracoes.user-settings-modal.account-section.on-logout" user={user} onLogout={onLogout} />
                    )}
                    {secao === "privacidade" && (
                      <PrivacidadeSection data-gc="configuracoes.user-settings-modal.privacidade-section" user={user} />
                    )}
                    {secao === "conexoes" && <ConexoesSection data-gc="configuracoes.user-settings-modal.conexoes-section" user={user} />}
                    {secao === "voz" && <VoiceSection data-gc="configuracoes.user-settings-modal.voice-section" parte="audio" />}
                    {secao === "video" && <VoiceSection data-gc="configuracoes.user-settings-modal.voice-section--2" parte="video" />}
                    {secao === "avisos" && <NotificationsSection data-gc="configuracoes.user-settings-modal.notifications-section" />}
                    {secao === "aplicativos" && <AplicativosSection data-gc="configuracoes.user-settings-modal.aplicativos-section" />}

                    {secao === "aparencia" && <AppearanceSection data-gc="configuracoes.user-settings-modal.appearance-section" />}
                    {secao === "bate-papo" && <BatePapoSection data-gc="configuracoes.user-settings-modal.bate-papo-section" />}
                    {secao === "acessibilidade" && <AcessibilidadeSection data-gc="configuracoes.user-settings-modal.acessibilidade-section" />}
                    {secao === "idioma" && <IdiomaSection data-gc="configuracoes.user-settings-modal.idioma-section" />}
                    {secao === "aplicativo" && <AplicativoSection data-gc="configuracoes.user-settings-modal.aplicativo-section" />}
                    {secao === "desktop" && <DesktopSection data-gc="configuracoes.user-settings-modal.desktop-section" />}
                    {secao === "atalhos" && <AtalhosSection data-gc="configuracoes.user-settings-modal.atalhos-section" />}
                    {secao === "avancado" && <AvancadoSection data-gc="configuracoes.user-settings-modal.avancado-section" />}
                    {secao === "servidor" && user.admin && <ServidorSection data-gc="configuracoes.user-settings-modal.servidor-section" />}
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

const ItemDaLateral: React.FC<ItemDaLateralProps> = ({
  item,
  ativo,
  subAtiva,
  onEscolher,
  onEscolherSub,
}) => {
  const { t } = useTranslation();
  const lista = useRef<HTMLDivElement>(null);

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
    <div data-gc="configuracoes.user-settings-modal.div--8" className="flex flex-col">
      <button data-gc="configuracoes.user-settings-modal.button.on-escolher"
        onClick={onEscolher}
        aria-current={ativo}
        aria-expanded={temSub ? ativo : undefined}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border px-2.5 py-[5px] text-left text-sm transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
          ativo
            ? "border-transparent bg-selecionado font-medium text-ink"
            : "border-transparent text-ink-muted hover:bg-hover hover:text-ink",
        )}
      >
        <item.icone data-gc="configuracoes.user-settings-modal.itemicone"
          size={20}
          className={cn(
            "shrink-0 transition",
            ativo ? "text-ink" : "text-ink-faint",
          )}
        />
        <span data-gc="configuracoes.user-settings-modal.span--5" className="min-w-0 flex-1 truncate">{t(item.chave)}</span>

        {temSub && (
          <ChevronRight data-gc="configuracoes.user-settings-modal.chevron-right"
            size={14}
            className={cn(
              "shrink-0 transition-transform duration-200 motion-reduce:transition-none",
              ativo ? "rotate-90 text-ink" : "text-ink-faint",
            )}
          />
        )}
      </button>

      {temSub && (
        <div data-gc="configuracoes.user-settings-modal.div--9"
          className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
          style={{ gridTemplateRows: ativo ? "1fr" : "0fr" }}
          aria-hidden={!ativo}
        >
          <div data-gc="configuracoes.user-settings-modal.div--10" className="overflow-hidden">
            <div data-gc="configuracoes.user-settings-modal.div--11"
              ref={lista}
              className="subarvore-de-config ml-[21px] mt-[3px] flex flex-col gap-0.5 pl-[7px]"
            >
              {item.subitens.map((sub) => (
                <button data-gc="configuracoes.user-settings-modal.button"
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
