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
  ArrowLeft,
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
  LogOut, Shield } from "lucide-react";

import { useNavigate } from "react-router";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { AccountSection } from "~/features/configuracoes/components/AccountSection";
import { AppearanceSection } from "~/features/configuracoes/components/AppearanceSection";
import { NotificationsSection } from "~/features/configuracoes/components/NotificationsSection";
import { VoiceSection } from "~/features/configuracoes/components/VoiceSection";
import { ConnectionsSection } from "~/features/configuracoes/components/ConexoesSection";
import { AppsSection } from "~/features/configuracoes/components/aplicativos/AplicativosSection";
import { ShortcutsSection } from "~/features/configuracoes/components/AtalhosSection";
import { DesktopSection } from "~/features/configuracoes/components/DesktopSection";
import { AdvancedSection } from "~/features/configuracoes/components/AvancadoSection";
import { AppSection } from "~/features/configuracoes/components/AplicativoSection";
import { AccessibilitySection } from "~/features/configuracoes/components/AcessibilidadeSection";
import { LanguageSection } from "~/features/configuracoes/components/IdiomaSection";
import { VoiceChatSection } from "~/features/configuracoes/components/BatePapoSection";
import { PrivacySection } from "~/features/configuracoes/components/PrivacidadeSection";
import { ErrorBoundary } from "~/features/app/components/ErrorBoundary";
import { Input } from "~/components/ui/input";
import { isDesktop } from "~/lib/desktop";
import { cn } from "~/lib/utils";
import {
  SUBSECTIONS,
  anchor,
  type Section,
  type SubSection,
} from "~/features/configuracoes/components/secoes";
import { LinkButton } from "~/features/configuracoes/components/BotaoDeLink";
import { VersionsFooter } from "~/features/configuracoes/components/RodapeDeVersoes";
import { SectionContext } from "~/features/configuracoes/components/SecaoDeConfig";
import { activeSubSection } from "~/features/configuracoes/components/espiao-da-rolagem";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";

export type { Section };

interface UserSettingsModalProps {
  open: boolean;
  user: SelfUserModel;
  onClose: () => void;
  onLogout: () => void;
  initialSection?: Section;
  onEditProfile: () => void;
}

interface Item {
  id: Section;
  key: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  subitems: SubSection[];
}

const groupsFor = (admin: boolean): { key: string; items: Item[] }[] => [
  {
    key: "configuracoes.grupos.conta",
    items: [
      {
        id: "account",
        key: "configuracoes.telas.conta",
        icon: User,
        subitems: SUBSECTIONS.account,
      },
      {
        id: "privacy",
        key: "configuracoes.telas.privacidade",
        icon: EyeOff,
        subitems: SUBSECTIONS.privacy,
      },
    ],
  },
  {
    key: "configuracoes.grupos.app",
    items: [
      {
        id: "appearance",
        key: "configuracoes.telas.aparencia",
        icon: Palette,
        subitems: SUBSECTIONS.appearance,
      },
      {
        id: "chat",
        key: "configuracoes.telas.batePapo",
        icon: MessageSquare,
        subitems: SUBSECTIONS.chat,
      },
      {
        id: "connections",
        key: "configuracoes.telas.conexoes",
        icon: Link2,
        subitems: SUBSECTIONS.connections,
      },
      {
        id: "voice",
        key: "configuracoes.telas.voz",
        icon: Mic,
        subitems: SUBSECTIONS.voice,
      },
      {
        id: "video",
        key: "configuracoes.telas.video",
        icon: Video,
        subitems: SUBSECTIONS.video,
      },
      {
        id: "notices",
        key: "configuracoes.telas.avisos",
        icon: Bell,
        subitems: SUBSECTIONS.notices,
      },
      {
        id: "accessibility",
        key: "configuracoes.telas.acessibilidade",
        icon: Accessibility,
        subitems: SUBSECTIONS.accessibility,
      },
      {
        id: "language",
        key: "configuracoes.telas.idioma",
        icon: Languages,
        subitems: SUBSECTIONS.language,
      },
      {
        id: "shortcuts" as const,
        key: "configuracoes.telas.atalhos",
        icon: Keyboard,
        subitems: SUBSECTIONS.shortcuts,
      },
      ...(isDesktop()
        ? [
            {
              id: "desktop" as const,
              key: "configuracoes.telas.desktop",
              icon: MonitorCog,
              subitems: SUBSECTIONS.desktop,
            },
          ]
        : [
            {
              id: "app" as const,
              key: "configuracoes.telas.aplicativo",
              icon: Download,
              subitems: SUBSECTIONS.app,
            },
          ]),
      {
        id: "advanced" as const,
        key: "configuracoes.telas.avancado",
        icon: SlidersHorizontal,
        subitems: SUBSECTIONS.advanced,
      },
    ],
  },
  {
    key: "configuracoes.grupos.desenvolvedor",
    items: [
      {
        id: "apps" as const,
        key: "configuracoes.telas.aplicativos",
        icon: Code2,
        subitems: SUBSECTIONS.apps,
      },
    ],
  },

];

const TITLES: Record<Section, string> = {
  account: "configuracoes.telas.conta",
  privacy: "configuracoes.telas.privacidade",
  connections: "configuracoes.telas.conexoes",
  voice: "configuracoes.telas.voz",
  video: "configuracoes.telas.video",
  notices: "configuracoes.telas.avisos",
  apps: "configuracoes.telas.aplicativos",
  appearance: "configuracoes.telas.aparencia",
  "chat": "configuracoes.telas.batePapo",
  accessibility: "configuracoes.telas.acessibilidade",
  language: "configuracoes.telas.idioma",
  app: "configuracoes.telas.aplicativo",
  desktop: "configuracoes.telas.desktop",
  shortcuts: "configuracoes.telas.atalhos",
  advanced: "configuracoes.telas.avancado",
};

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  open,
  user,
  onClose,
  onLogout,
  initialSection = "account",
  onEditProfile,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>(initialSection);
  const [search, setSearch] = useState("");
  const [activeSub, setSubActive] = useState<string | null>(null);

  /*
    No celular a janela não cabe partida em duas: a lateral tem 252 px de
    mínimo, o que sobrava para o conteúdo era menos de um terço da tela. Aqui
    ela vira mestre-detalhe — a lista ocupa tudo, escolher abre a seção por
    cima dela, e um botão de voltar desfaz. A partir de `md` volta a ser a
    janela de sempre, com as duas colunas lado a lado.
  */
  const [contentIsOpen, setContentIsOpen] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = groupsFor(user.admin);
    if (!term) return all;

    return all
      .map((group) => ({
        ...group,
        items: group.items
          .map((item) => {
            const matchItem = t(item.key).toLowerCase().includes(term);
            const subitems = matchItem
              ? item.subitems
              : item.subitems.filter((sub) =>
                  t(sub.key).toLowerCase().includes(term),
                );

            return { ...item, subitems };
          })
          .filter(
            (item) =>
              t(item.key).toLowerCase().includes(term) ||
              item.subitems.length > 0,
          ),
      }))
      .filter((group) => group.items.length > 0);
  }, [search, user.admin, t]);

  useEffect(() => {
    setSubActive(SUBSECTIONS[section][0]?.id ?? null);
    scroll.current?.scrollTo({ top: 0 });
  }, [section]);

  const choiceManual = useRef<string | null>(null);

  const irFor = useCallback((sectionDestination: Section, sub: string) => {
    setSection(sectionDestination);
    setSubActive(sub);
    choiceManual.current = sub;

    requestAnimationFrame(() => {
      document
        .getElementById(anchor(sub))
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }, []);

  const initialSub = useSettings((s) => s.initialSub);
  const initialConsumeSub = useSettings((s) => s.initialConsumeSub);

  useEffect(() => {
    if (!open) return;

    setSection(initialSection);
    setContentIsOpen(false);
    if (!initialSub) return;

    irFor(initialSection, initialSub);
    initialConsumeSub();
  }, [open, initialSection, initialSub, irFor, initialConsumeSub]);

  const dropChoice = useCallback(() => {
    choiceManual.current = null;
  }, []);

  const onScroll = useCallback(() => {
    const panel = scroll.current;
    if (!panel) return;

    if (choiceManual.current) return;

    const sections = SUBSECTIONS[section];
    const panelTop = panel.getBoundingClientRect().top;

    setSubActive(
      activeSubSection({
        anchors: sections.flatMap((sub) => {
          const target = document.getElementById(anchor(sub.id));
          return target ? [{ id: sub.id, top: target.getBoundingClientRect().top - panelTop }] : [];
        }),
        line: 80,
        scrollTotal: panel.scrollHeight - panel.clientHeight,
      }),
    );
  }, [section]);

  return (
    <DialogPrimitive.Root data-gc="configuracoes.user-settings-modal.dialog-primitiveroot"
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay data-gc="configuracoes.user-settings-modal.dialog-primitiveoverlay" className="fixed inset-0 z-50 bg-veu" />
        <DialogPrimitive.Content data-gc="configuracoes.user-settings-modal.dialog-primitivecontent"
          className={cn(
            "gaveta-segura regiao-sem-arrasto fixed inset-0 z-50 m-auto flex h-full w-full overflow-hidden bg-surface-1 shadow-2xl outline-none md:h-[min(60rem,92vh)] md:w-[min(87.5rem,94vw)] md:rounded-xl",
            flxCls("settingsWindow"),
          )}
          aria-label="Configurações do usuário"
        >
          <DialogPrimitive.Title data-gc="configuracoes.user-settings-modal.dialog-primitivetitle" className="sr-only">
            Configurações do usuário
          </DialogPrimitive.Title>

          <nav data-gc="configuracoes.user-settings-modal.nav" {...flx("settingsSide", cn(
              "w-full shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface-4 px-3 pb-0 pt-4",
              "md:flex md:w-[max(15.75rem,min(24svw,20rem))]",
              contentIsOpen ? "hidden" : "flex",
              flxCls("settingsSideInternal"),
            ))} {...flxAttr("settingsSideInternal")}>
            {/*
              No celular a lista ocupa a tela inteira e o X da janela fica do
              outro lado, escondido junto com o conteúdo. Sem este botão não há
              saída: nem fechar, nem voltar.
            */}
            <div data-gc="configuracoes.user-settings-modal.div" className="flex items-center justify-between gap-2 md:hidden">
              <span data-gc="configuracoes.user-settings-modal.span" className="text-base font-semibold">Configurações</span>

              <DialogPrimitive.Close
                aria-label="Fechar"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-faint transition hover:bg-hover hover:text-ink"
              >
                <X data-gc="configuracoes.user-settings-modal.x" size={20} />
              </DialogPrimitive.Close>
            </div>

            <div data-gc="configuracoes.user-settings-modal.div--2" className="relative">
              <Search data-gc="configuracoes.user-settings-modal.search"
                size={15}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <Input data-gc="configuracoes.user-settings-modal.input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar configurações"
                aria-label="Pesquisar configurações"
                className="h-9 border-transparent pl-8 text-sm shadow-none focus-visible:border-line-sutil focus-visible:ring-0"
              />
            </div>

            <button data-gc="configuracoes.user-settings-modal.button.on-edit-profile"
              onClick={onEditProfile}
              className={cn("flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-hover", flxCls("profileSettings"))}
            >
              <Avatar data-gc="configuracoes.user-settings-modal.avatar"
                id={user.id}
                name={user.displayName}
                url={user.avatarUrl}
                size={36}
                charms={user.profile}
              />
              <span data-gc="configuracoes.user-settings-modal.span--2" className="min-w-0 flex-1">
                <span data-gc="configuracoes.user-settings-modal.span--3" className="block truncate text-sm font-semibold">
                  {user.displayName}
                </span>
                <span data-gc="configuracoes.user-settings-modal.span--4" className="flex items-center gap-1 text-xs text-ink-muted">
                  Editar perfil <Pencil data-gc="configuracoes.user-settings-modal.pencil" size={11} />
                </span>
              </span>
            </button>

            <div data-gc="configuracoes.user-settings-modal.div--3" className="flex flex-col gap-2">
              {groups.map((group) => (
                <div data-gc="configuracoes.user-settings-modal.div--4" key={group.key} {...flx("settingsGroup", "flex flex-col gap-[3px]")}>
                  <p data-gc="configuracoes.user-settings-modal.p" {...flx("groupSettingsTitle", "truncate px-2.5 pb-[3px] pt-1 text-11 font-semibold uppercase leading-4 tracking-[0.02em] text-ink-faint")}>
                    {t(group.key)}
                  </p>

                  {group.items.map((item) => (
                    <SideItem data-gc="configuracoes.user-settings-modal.side-item"
                      key={item.id}
                      item={item}
                      active={section === item.id}
                      activeSub={section === item.id ? activeSub : null}
                      onPick={() => {
                        setSection(item.id);
                        setContentIsOpen(true);
                      }}
                      onPickSub={(sub) => {
                        irFor(item.id, sub);
                        setContentIsOpen(true);
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>

            {!groups.length && (
              <p data-gc="configuracoes.user-settings-modal.p--2" className="px-2 text-xs text-ink-faint">
                Nada com esse nome por aqui.
              </p>
            )}

            <div data-gc="configuracoes.user-settings-modal.div--5" className="mt-auto flex flex-col pb-3 pt-2">
              {user.admin && (
                <button data-gc="configuracoes.user-settings-modal.button"
                  onClick={() => {
                    onClose();
                    navigate("/admin");
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-ink-muted transition hover:bg-hover hover:text-ink"
                >
                  <Shield data-gc="configuracoes.user-settings-modal.shield" size={16} className="shrink-0" />
                  {t("configuracoes.grupos.administracao")}
                </button>
              )}

              <button data-gc="configuracoes.user-settings-modal.button.on-logout"
                onClick={onLogout}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-danger transition hover:bg-danger-fundo"
              >
                <LogOut data-gc="configuracoes.user-settings-modal.log-out" size={16} className="shrink-0" />
                {t("configuracoes.sair")}
              </button>

              <ErrorBoundary where="configurações · versões" compact>
                <VersionsFooter data-gc="configuracoes.user-settings-modal.versions-footer" />
              </ErrorBoundary>
            </div>
          </nav>

          <div data-gc="configuracoes.user-settings-modal.div--6" {...flx("settingsContent", cn("min-w-0 flex-1 flex-col md:flex", contentIsOpen ? "flex" : "hidden"))}>
            <div data-gc="configuracoes.user-settings-modal.div--7" {...flx("settingsTop", cn("flex h-15 shrink-0 items-center justify-between gap-4 border-b border-line px-4", flxCls("windowSettingsTop")))}>
              <h2 data-gc="configuracoes.user-settings-modal.h2" className="group/titulo flex min-w-0 items-center gap-1.5 text-lg font-semibold">
                <button data-gc="configuracoes.user-settings-modal.button--2"
                  type="button"
                  onClick={() => setContentIsOpen(false)}
                  aria-label="Voltar para a lista"
                  className="-ml-1 shrink-0 rounded p-1 text-ink-muted transition hover:bg-hover hover:text-ink md:hidden"
                >
                  <ArrowLeft data-gc="configuracoes.user-settings-modal.arrow-left" size={18} />
                </button>
                <span data-gc="configuracoes.user-settings-modal.span--5" className="truncate">{t(TITLES[section])}</span>
                <LinkButton data-gc="configuracoes.user-settings-modal.link-button" section={section} oQue="esta página" />
              </h2>

              <DialogPrimitive.Close
                aria-label="Fechar"
                className="flex size-[34px] shrink-0 items-center justify-center rounded-lg text-ink-faint transition hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foco-anel"
              >
                <X data-gc="configuracoes.user-settings-modal.x--2" size={20} />
              </DialogPrimitive.Close>
            </div>

            <div data-gc="configuracoes.user-settings-modal.div.on-scroll"
              ref={scroll}
              onScroll={onScroll}
              onWheel={dropChoice}
              onTouchMove={dropChoice}
              onKeyDown={dropChoice}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <div data-gc="configuracoes.user-settings-modal.div--8" className="mx-auto w-full max-w-[max(40rem,min(90%,50rem))] px-[clamp(1rem,3vw,1.5rem)] pb-8 pt-5">
                <SectionContext.Provider value={section}>
                  <ErrorBoundary
                    key={section}
                    where={`configurações · ${section}`}
                    compact
                  >
                    {section === "account" && (
                      <AccountSection data-gc="configuracoes.user-settings-modal.account-section.on-logout" user={user} onLogout={onLogout} />
                    )}
                    {section === "privacy" && (
                      <PrivacySection data-gc="configuracoes.user-settings-modal.privacy-section" user={user} />
                    )}
                    {section === "connections" && <ConnectionsSection data-gc="configuracoes.user-settings-modal.connections-section" user={user} />}
                    {section === "voice" && <VoiceSection data-gc="configuracoes.user-settings-modal.voice-section" part="audio" />}
                    {section === "video" && <VoiceSection data-gc="configuracoes.user-settings-modal.voice-section--2" part="video" />}
                    {section === "notices" && <NotificationsSection data-gc="configuracoes.user-settings-modal.notifications-section" />}
                    {section === "apps" && <AppsSection data-gc="configuracoes.user-settings-modal.apps-section" />}

                    {section === "appearance" && <AppearanceSection data-gc="configuracoes.user-settings-modal.appearance-section" />}
                    {section === "chat" && <VoiceChatSection data-gc="configuracoes.user-settings-modal.voice-chat-section" />}
                    {section === "accessibility" && <AccessibilitySection data-gc="configuracoes.user-settings-modal.accessibility-section" />}
                    {section === "language" && <LanguageSection data-gc="configuracoes.user-settings-modal.language-section" />}
                    {section === "app" && <AppSection data-gc="configuracoes.user-settings-modal.app-section" />}
                    {section === "desktop" && <DesktopSection data-gc="configuracoes.user-settings-modal.desktop-section" />}
                    {section === "shortcuts" && <ShortcutsSection data-gc="configuracoes.user-settings-modal.shortcuts-section" />}
                    {section === "advanced" && <AdvancedSection data-gc="configuracoes.user-settings-modal.advanced-section" />}
                  </ErrorBoundary>
                </SectionContext.Provider>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

interface SidePropsItem {
  item: Item;
  active: boolean;
  activeSub: string | null;
  onPick: () => void;
  onPickSub: (sub: string) => void;
}

const SideItem: React.FC<SidePropsItem> = ({
  item,
  active,
  activeSub,
  onPick,
  onPickSub,
}) => {
  const { t } = useTranslation();
  const list = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;

    const marked = el.querySelector<HTMLElement>('[data-ativo="true"]');

    if (!marked) {
      el.removeAttribute("data-tem-ativo");
      return;
    }

    el.setAttribute("data-tem-ativo", "true");
    el.style.setProperty("--active-top", `${marked.offsetTop}px`);
    el.style.setProperty("--active-height", `${marked.offsetHeight}px`);
  }, [activeSub, active, item.subitems]);

  const hasSub = item.subitems.length > 0;

  return (
    <div data-gc="configuracoes.user-settings-modal.div--9" className="flex flex-col">
      <button data-gc="configuracoes.user-settings-modal.button.on-pick"
        onClick={onPick}
        aria-current={active}
        aria-expanded={hasSub ? active : undefined}
        className={cn(
          flxCls("settingsItem"),
          "flex w-full items-center gap-2 rounded-lg border px-2.5 py-[5px] text-left text-sm transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foco-anel",
          active
            ? cn("border-transparent bg-selecionado font-medium text-ink", flxCls("settingsActiveItem"))
            : "border-transparent text-ink-muted hover:bg-hover hover:text-ink",
        )}
      >
        <item.icon data-gc="configuracoes.user-settings-modal.itemicon"
          size={20}
          className={cn(
            flxCls("itemSettingsIcon"),
            "shrink-0 transition",
            active ? "text-ink" : "text-ink-faint",
          )}
        />
        <span data-gc="configuracoes.user-settings-modal.span--6" {...flx("itemSettingsLabel", "min-w-0 flex-1 truncate")}>{t(item.key)}</span>

        {hasSub && (
          <ChevronRight data-gc="configuracoes.user-settings-modal.chevron-right"
            size={14}
            className={cn(
              "shrink-0 transition-transform duration-200 motion-reduce:transition-none",
              active ? "rotate-90 text-ink" : "text-ink-faint",
            )}
          />
        )}
      </button>

      {hasSub && (
        <div data-gc="configuracoes.user-settings-modal.div--10"
          className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
          style={{ gridTemplateRows: active ? "1fr" : "0fr" }}
          aria-hidden={!active}
        >
          <div data-gc="configuracoes.user-settings-modal.div--11" className="overflow-hidden">
            <div data-gc="configuracoes.user-settings-modal.div--12"
              ref={list}
              className="subarvore-de-config ml-[21px] mt-[3px] flex flex-col gap-0.5 pl-[7px]"
            >
              {item.subitems.map((sub) => (
                <button data-gc="configuracoes.user-settings-modal.button--3"
                  key={sub.id}
                  data-ativo={activeSub === sub.id}
                  tabIndex={active ? 0 : -1}
                  onClick={() => onPickSub(sub.id)}
                  className={cn(
                    "relative z-10 truncate rounded-md border px-2.5 py-1 text-left text-13 transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foco-anel",
                    activeSub === sub.id
                      ? "border-transparent bg-selecionado font-semibold text-ink"
                      : "border-transparent text-ink-faint hover:bg-hover hover:text-ink-muted",
                  )}
                >
                  {t(sub.key)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
