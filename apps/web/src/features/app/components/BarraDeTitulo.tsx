import React from "react";
import { ChatsCircle, Compass, CopySimple, Minus, Square, UsersThree, X } from "@phosphor-icons/react";
import { useLocation, useMatch } from "react-router";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useSession } from "~/contexts/session-context";
import { ehDesktop } from "~/lib/desktop";
import { avatarColor, initials } from "~/lib/format";

import { cn } from "~/lib/utils";
import { flx, flxCls } from "~/lib/compat-de-tema";

const ControlesDaJanela: React.FC = () => {
  const [propria, setPropria] = React.useState(false);
  const [maximizada, setMaximizada] = React.useState(false);
  const janela = window.gravae?.janela;

  const completa =
    !!janela?.molduraPropria &&
    !!janela.estaMaximizada &&
    !!janela.aoMudarMaximizada &&
    !!janela.minimizar &&
    !!janela.alternarMaximizada &&
    !!janela.fechar;

  React.useEffect(() => {
    if (!completa || !janela?.molduraPropria) return;

    void janela.molduraPropria().then(setPropria);
    void janela.estaMaximizada?.().then(setMaximizada);

    return janela.aoMudarMaximizada?.(setMaximizada);
  }, [completa, janela]);

  if (!completa || !propria || !janela) return null;

  const botao = cn(
    flxCls("botaoDaJanela"),
    "regiao-sem-arrasto flex h-8 w-11 items-center justify-center text-ink-muted transition",
    "hover:bg-hover hover:text-ink",
  );

  return (
    <div data-gc="app.barra-de-titulo.div" className={cn(flxCls("controlesDaJanela"), "absolute right-0 top-0 flex")}>
      <button data-gc="app.barra-de-titulo.button" type="button" aria-label="Minimizar" className={botao} onClick={() => void janela.minimizar?.()}>
        <Minus data-gc="app.barra-de-titulo.minus" size={14} />
      </button>

      <button data-gc="app.barra-de-titulo.button--2"
        type="button"
        aria-label={maximizada ? "Restaurar" : "Maximizar"}
        className={botao}
        onClick={() => void janela.alternarMaximizada?.()}
      >
        {maximizada ? <CopySimple data-gc="app.barra-de-titulo.copy-simple" size={13} /> : <Square data-gc="app.barra-de-titulo.square" size={12} />}
      </button>

      <button data-gc="app.barra-de-titulo.button--3"
        type="button"
        aria-label="Fechar"
        className={cn(botao, "hover:bg-danger hover:text-sobre-marca")}
        onClick={() => void janela.fechar?.()}
      >
        <X data-gc="app.barra-de-titulo.x" size={14} />
      </button>
    </div>
  );
};

const LUGARES: { teste: (caminho: string) => boolean; icone: React.ReactNode; titulo: string }[] = [
  {
    teste: (c) => c.startsWith("/dm/solicitacoes"),
    icone: null,
    titulo: "",
  },
  {
    teste: (c) => c === "/dm" || c === "/dm/",
    icone: <UsersThree data-gc="app.barra-de-titulo.users-three" size={14} weight="fill" />,
    titulo: "Amigos",
  },
  {
    teste: (c) => c.startsWith("/dm/"),
    icone: <ChatsCircle data-gc="app.barra-de-titulo.chats-circle" size={14} weight="fill" />,
    titulo: "Mensagens diretas",
  },
  {
    teste: (c) => c.startsWith("/explorar"),
    icone: <Compass data-gc="app.barra-de-titulo.compass" size={14} weight="fill" />,
    titulo: "Explorar",
  },
];

export const BarraDeTitulo: React.FC = () => {
  const rota = useMatch("/channels/:guildId/*");
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
  if (!user && !ehDesktop()) return null;

  const atual = guilds.find((g) => g.id === rota?.params.guildId);
  const lugar = atual ? null : LUGARES.find((l) => l.teste(pathname));

  return (
    <header data-gc="app.barra-de-titulo.header" {...flx("barraDeTitulo", "regiao-de-arrasto relative flex h-8 shrink-0 items-center justify-center bg-surface-1 px-2")}>
      <span data-gc="app.barra-de-titulo.span" className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-ink-muted">
        {atual ? (
          <>
            {atual.iconUrl ? (
              <img data-gc="app.barra-de-titulo.img" src={atual.iconUrl} alt="" className="size-4 shrink-0 rounded object-cover" />
            ) : (
              <span data-gc="app.barra-de-titulo.span--2"
                aria-hidden
                className="flex size-4 shrink-0 items-center justify-center rounded text-10 font-bold text-sobre-marca"
                style={{ backgroundColor: avatarColor(atual.id) }}
              >
                {initials(atual.name)}
              </span>
            )}
            <span data-gc="app.barra-de-titulo.span--3" className="truncate">{atual.name}</span>
          </>
        ) : lugar?.titulo ? (
          <>
            <span data-gc="app.barra-de-titulo.span--4" aria-hidden className="flex shrink-0 items-center text-ink-faint">
              {lugar.icone}
            </span>
            <span data-gc="app.barra-de-titulo.span--5" className="truncate">{lugar.titulo}</span>
          </>
        ) : null}
      </span>

      <ControlesDaJanela data-gc="app.barra-de-titulo.controles-da-janela" />
    </header>
  );
};
