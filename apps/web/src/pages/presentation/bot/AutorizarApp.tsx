import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Check, ShieldAlert } from "lucide-react";

import { api } from "~/@core/lib/api";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { useSession } from "~/contexts/session-context";
import { useQuery } from "@tanstack/react-query";

interface PedidoModel {
  bot: { id: string; usuario: { id: string; displayName: string; username: string; avatarUrl: string | null }; descricao: string | null };
  escopos: string[];
  redirectUri: string;
}

const EXPLICA: Record<string, string> = {
  identify: "Ver seu nome, apelido e foto",
  guilds: "Saber em quais servidores você está e onde você manda",
};

export const AutorizarApp: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useSession();
  const [enviando, setEnviando] = useState(false);

  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const scope = params.get("scope") ?? "identify";
  const state = params.get("state") ?? "";

  const pedido = useQuery({
    queryKey: ["oauth-pedido", clientId, redirectUri, scope],
    queryFn: async () => {
      const { data } = await api.get<PedidoModel>("/oauth2/pedido", {
        params: { client_id: clientId, redirect_uri: redirectUri, scope },
      });
      return data;
    },
    enabled: Boolean(clientId && redirectUri),
    retry: false,
  });

  const autorizar = async () => {
    setEnviando(true);

    try {
      const { data } = await api.post<{ codigo: string; redirectUri: string }>("/oauth2/autorizar", {
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
      });

      const destino = new URL(data.redirectUri);
      destino.searchParams.set("code", data.codigo);
      if (state) destino.searchParams.set("state", state);

      window.location.href = destino.toString();
    } catch {
      setEnviando(false);
    }
  };

  if (pedido.isLoading) {
    return <Moldura data-gc="bot.autorizar-app.moldura"><p data-gc="bot.autorizar-app.p" className="text-sm text-ink-faint">Carregando…</p></Moldura>;
  }

  if (pedido.isError || !pedido.data) {
    return (
      <Moldura data-gc="bot.autorizar-app.moldura--2">
        <ShieldAlert data-gc="bot.autorizar-app.shield-alert" size={40} className="mx-auto text-ink-faint" />
        <h1 data-gc="bot.autorizar-app.h1" className="mt-4 text-center text-xl font-semibold">Pedido inválido</h1>
        <p data-gc="bot.autorizar-app.p--2" className="mt-2 text-center text-sm text-ink-muted">
          O endereço de retorno não está registrado nessa aplicação, ou o link veio errado. Não
          autorize nada por aqui.
        </p>
        <Button data-gc="bot.autorizar-app.button" className="mt-6 w-full" onClick={() => navigate("/channels")}>
          Voltar
        </Button>
      </Moldura>
    );
  }

  const { bot, escopos } = pedido.data;

  return (
    <Moldura data-gc="bot.autorizar-app.moldura--3">
      <div data-gc="bot.autorizar-app.div" className="flex items-center justify-center gap-3">
        <Avatar data-gc="bot.autorizar-app.avatar" id={bot.usuario.id} name={bot.usuario.displayName} url={bot.usuario.avatarUrl} size={56} />
        <span data-gc="bot.autorizar-app.span" className="text-ink-faint">•••</span>
        <Avatar data-gc="bot.autorizar-app.avatar--2" id={user?.id ?? ""} name={user?.displayName ?? ""} url={user?.avatarUrl ?? null} size={56} />
      </div>

      <h1 data-gc="bot.autorizar-app.h1--2" className="mt-4 text-center text-lg">
        <span data-gc="bot.autorizar-app.span--2" className="font-semibold">{bot.usuario.displayName}</span>{" "}
        <span data-gc="bot.autorizar-app.span--3" className="rounded bg-brand px-1.5 py-0.5 text-10 font-bold uppercase text-white">
          app
        </span>
        <span data-gc="bot.autorizar-app.span--4" className="mt-1 block text-sm text-ink-muted">quer acessar sua conta</span>
      </h1>

      <p data-gc="bot.autorizar-app.p--3" className="mt-1 text-center text-xs text-ink-faint">
        Conectado como {user?.displayName}
      </p>

      {bot.descricao && (
        <p data-gc="bot.autorizar-app.p--4" className="mt-3 text-center text-sm text-ink-muted">{bot.descricao}</p>
      )}

      <div data-gc="bot.autorizar-app.div--2" className="mt-5 rounded bg-surface-0 p-3">
        <p data-gc="bot.autorizar-app.p--5" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Isso vai permitir que {bot.usuario.displayName}
        </p>

        <ul data-gc="bot.autorizar-app.ul" className="mt-2 space-y-1.5">
          {escopos.map((escopo) => (
            <li data-gc="bot.autorizar-app.li" key={escopo} className="flex items-center gap-2 text-sm text-ink-muted">
              <Check data-gc="bot.autorizar-app.check" size={14} className="shrink-0 text-online" />
              {EXPLICA[escopo] ?? escopo}
            </li>
          ))}
        </ul>
      </div>

      <p data-gc="bot.autorizar-app.p--6" className="mt-3 break-all text-center text-xs text-ink-faint">
        Você volta para <span data-gc="bot.autorizar-app.span--5" className="text-ink-muted">{new URL(pedido.data.redirectUri).host}</span>
      </p>

      <div data-gc="bot.autorizar-app.div--3" className="mt-5 flex gap-2">
        <Button data-gc="bot.autorizar-app.button--2" variant="surface" className="flex-1" onClick={() => navigate("/channels")}>
          Cancelar
        </Button>

        <Button data-gc="bot.autorizar-app.button--3" className="flex-1" disabled={enviando} onClick={() => void autorizar()}>
          Autorizar
        </Button>
      </div>
    </Moldura>
  );
};

const Moldura: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main data-gc="bot.autorizar-app.main" className="flex min-h-dvh items-center justify-center bg-surface-0 p-4">
    <div data-gc="bot.autorizar-app.div--4" className="w-full max-w-md rounded-lg bg-surface-1 p-6 shadow-2xl">{children}</div>
  </main>
);
