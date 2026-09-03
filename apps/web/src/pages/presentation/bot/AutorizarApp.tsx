import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Check, ShieldAlert } from "lucide-react";

import { api } from "~/@core/lib/api";
import { Avatar } from "~/components/Avatar";
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

/**
 * A tela que o OAuth2 abre — o "quer acessar sua conta" do Discord.
 *
 * Quem chega aqui veio de um site de fora que quer falar com o Gravaê em seu
 * nome. Por isso a tela é seca: quem é a aplicação, o que ela vai poder ver, e
 * PARA ONDE você volta depois. Esse último é o que ninguém costuma mostrar, e
 * é justamente o que denuncia um link torto.
 */
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

      /*
        O `state` volta intocado porque é do site do dev, não nosso: é com ele
        que o painel confere que a resposta pertence ao pedido que ele mesmo
        começou.
      */
      const destino = new URL(data.redirectUri);
      destino.searchParams.set("code", data.codigo);
      if (state) destino.searchParams.set("state", state);

      window.location.href = destino.toString();
    } catch {
      setEnviando(false);
    }
  };

  if (pedido.isLoading) {
    return <Moldura><p className="text-sm text-ink-faint">Carregando…</p></Moldura>;
  }

  if (pedido.isError || !pedido.data) {
    return (
      <Moldura>
        <ShieldAlert size={40} className="mx-auto text-ink-faint" />
        <h1 className="mt-4 text-center text-xl font-semibold">Pedido inválido</h1>
        <p className="mt-2 text-center text-sm text-ink-muted">
          O endereço de retorno não está registrado nessa aplicação, ou o link veio errado. Não
          autorize nada por aqui.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate("/channels")}>
          Voltar
        </Button>
      </Moldura>
    );
  }

  const { bot, escopos } = pedido.data;

  return (
    <Moldura>
      <div className="flex items-center justify-center gap-3">
        <Avatar id={bot.usuario.id} name={bot.usuario.displayName} url={bot.usuario.avatarUrl} size={56} />
        <span className="text-ink-faint">•••</span>
        <Avatar id={user?.id ?? ""} name={user?.displayName ?? ""} url={user?.avatarUrl ?? null} size={56} />
      </div>

      <h1 className="mt-4 text-center text-lg">
        <span className="font-semibold">{bot.usuario.displayName}</span>{" "}
        <span className="rounded bg-brand px-1.5 py-0.5 text-10 font-bold uppercase text-white">
          app
        </span>
        <span className="mt-1 block text-sm text-ink-muted">quer acessar sua conta</span>
      </h1>

      <p className="mt-1 text-center text-xs text-ink-faint">
        Conectado como {user?.displayName}
      </p>

      {bot.descricao && (
        <p className="mt-3 text-center text-sm text-ink-muted">{bot.descricao}</p>
      )}

      <div className="mt-5 rounded bg-surface-0 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Isso vai permitir que {bot.usuario.displayName}
        </p>

        <ul className="mt-2 space-y-1.5">
          {escopos.map((escopo) => (
            <li key={escopo} className="flex items-center gap-2 text-sm text-ink-muted">
              <Check size={14} className="shrink-0 text-online" />
              {EXPLICA[escopo] ?? escopo}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 break-all text-center text-xs text-ink-faint">
        Você volta para <span className="text-ink-muted">{new URL(pedido.data.redirectUri).host}</span>
      </p>

      <div className="mt-5 flex gap-2">
        <Button variant="surface" className="flex-1" onClick={() => navigate("/channels")}>
          Cancelar
        </Button>

        <Button className="flex-1" disabled={enviando} onClick={() => void autorizar()}>
          Autorizar
        </Button>
      </div>
    </Moldura>
  );
};

const Moldura: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="flex min-h-dvh items-center justify-center bg-surface-0 p-4">
    <div className="w-full max-w-md rounded-lg bg-surface-1 p-6 shadow-2xl">{children}</div>
  </main>
);
