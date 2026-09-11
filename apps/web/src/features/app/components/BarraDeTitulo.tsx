import React from "react";
import { ChatsCircle, Compass, CopySimple, Minus, Square, UsersThree, X } from "@phosphor-icons/react";
import { useLocation, useMatch } from "react-router";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useSession } from "~/contexts/session-context";
import { desktop, isDesktop } from "~/lib/desktop";
import { avatarColor, initials } from "~/lib/format";

import { cn } from "~/lib/utils";
import { flx, flxCls } from "~/lib/compat-de-tema";

const WindowControls: React.FC = () => {
  const [own, setOwn] = React.useState(false);
  const [maximized, setMaximized] = React.useState(false);
  const appWindow = desktop()?.appWindow;

  const complete =
    !!appWindow?.frameOwn &&
    !!appWindow.thisMaximized &&
    !!appWindow.onChangeMaximized &&
    !!appWindow.minimize &&
    !!appWindow.toggleMaximized &&
    !!appWindow.close;

  React.useEffect(() => {
    if (!complete || !appWindow?.frameOwn) return;

    void appWindow.frameOwn().then(setOwn);
    void appWindow.thisMaximized?.().then(setMaximized);

    return appWindow.onChangeMaximized?.(setMaximized);
  }, [complete, appWindow]);

  if (!complete || !own || !appWindow) return null;

  const button = cn(
    flxCls("windowButton"),
    "regiao-sem-arrasto flex h-8 w-11 items-center justify-center text-ink-muted transition",
    "hover:bg-hover hover:text-ink",
  );

  return (
    <div data-gc="app.barra-de-titulo.div" className={cn(flxCls("windowControls"), "absolute right-0 top-0 flex")}>
      <button data-gc="app.barra-de-titulo.button" type="button" aria-label="Minimizar" className={button} onClick={() => void appWindow.minimize?.()}>
        <Minus data-gc="app.barra-de-titulo.minus" size={14} />
      </button>

      <button data-gc="app.barra-de-titulo.button--2"
        type="button"
        aria-label={maximized ? "Restaurar" : "Maximizar"}
        className={button}
        onClick={() => void appWindow.toggleMaximized?.()}
      >
        {maximized ? <CopySimple data-gc="app.barra-de-titulo.copy-simple" size={13} /> : <Square data-gc="app.barra-de-titulo.square" size={12} />}
      </button>

      <button data-gc="app.barra-de-titulo.button--3"
        type="button"
        aria-label="Fechar"
        className={cn(button, "hover:bg-danger hover:text-sobre-marca")}
        onClick={() => void appWindow.close?.()}
      >
        <X data-gc="app.barra-de-titulo.x" size={14} />
      </button>
    </div>
  );
};

const PLACES: { test: (path: string) => boolean; icon: React.ReactNode; title: string }[] = [
  {
    test: (c) => c.startsWith("/dm/solicitacoes"),
    icon: null,
    title: "",
  },
  {
    test: (c) => c === "/dm" || c === "/dm/",
    icon: <UsersThree data-gc="app.barra-de-titulo.users-three" size={14} weight="fill" />,
    title: "Amigos",
  },
  {
    test: (c) => c.startsWith("/dm/"),
    icon: <ChatsCircle data-gc="app.barra-de-titulo.chats-circle" size={14} weight="fill" />,
    title: "Mensagens diretas",
  },
  {
    test: (c) => c.startsWith("/explorar"),
    icon: <Compass data-gc="app.barra-de-titulo.compass" size={14} weight="fill" />,
    title: "Explorar",
  },
];

export const TitleBar: React.FC = () => {
  const route = useMatch("/channels/:guildId/*");
  const { pathname } = useLocation();
  const { user } = useSession();
  const { data: guilds = [] } = useFindManyGuilds(Boolean(user));

  /*
    Sem sessão, a faixa não tem o que dizer: não há servidor, não há lugar. No
    navegador ela virava uma tarja escura em cima da tela de entrada e do
    splash. No aplicativo ela FICA mesmo assim, porque é ela que carrega os
    botões de minimizar, maximizar e fechar — some ela, some o jeito de fechar
    a janela.
  */
  if (!user && !isDesktop()) return null;

  const current = guilds.find((g) => g.id === route?.params.guildId);
  const place = current ? null : PLACES.find((l) => l.test(pathname));

  return (
    <header data-gc="app.barra-de-titulo.header" {...flx("titleBar", "barra-de-titulo regiao-de-arrasto relative flex h-8 shrink-0 items-center justify-center bg-surface-1 px-2")}>
      <span data-gc="app.barra-de-titulo.span" className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-ink-muted">
        {current ? (
          <>
            {current.iconUrl ? (
              <img data-gc="app.barra-de-titulo.img" src={current.iconUrl} alt="" className="size-4 shrink-0 rounded object-cover" />
            ) : (
              <span data-gc="app.barra-de-titulo.span--2"
                aria-hidden
                className="flex size-4 shrink-0 items-center justify-center rounded text-10 font-bold text-sobre-marca"
                style={{ backgroundColor: avatarColor(current.id) }}
              >
                {initials(current.name)}
              </span>
            )}
            <span data-gc="app.barra-de-titulo.span--3" className="truncate">{current.name}</span>
          </>
        ) : place?.title ? (
          <>
            <span data-gc="app.barra-de-titulo.span--4" aria-hidden className="flex shrink-0 items-center text-ink-faint">
              {place.icon}
            </span>
            <span data-gc="app.barra-de-titulo.span--5" className="truncate">{place.title}</span>
          </>
        ) : null}
      </span>

      <WindowControls data-gc="app.barra-de-titulo.window-controls" />
    </header>
  );
};
