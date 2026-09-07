import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, X } from "lucide-react";
import { ESCOPOS_OAUTH, PERMISSION_LABELS, ehEscopo, type EscopoOAuth, type Permission } from "@gravae/shared";

import { useBotDestinations } from "~/@core/application/queries/bot/use-bots";
import { api } from "~/@core/lib/api";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { CampoSelect } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Avatar } from "~/features/perfil/components/Avatar";
import { cn } from "~/lib/utils";

interface PedidoModel {
  bot: {
    id: string;
    usuario: { id: string; displayName: string; username: string; avatarUrl: string | null };
    descricao: string | null;
    permissoesPedidas: Permission[];
  };
  escopos: EscopoOAuth[];
  redirectUri: string;
}

type Passo = "escopos" | "permissoes" | "destino";

/*
  Autorizar uma aplicação, em até três passos.

  O primeiro é sempre o dos escopos: cada um tem a chave, menos o `bot`,
  que é obrigatório quando pedido. Com o bot vêm mais dois: as permissões
  que ele vai ter (com aviso quando pede administrador) e a comunidade onde
  entra. Sem o bot, é um passo só.
*/
export const AutorizarApp: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  const comBot = pedido.data?.escopos.includes("bot") ?? false;
  const destinos = useBotDestinations(comBot ? pedido.data?.bot.id : undefined);

  const [passo, setPasso] = useState<Passo>("escopos");
  const [ligados, setLigados] = useState<Set<string>>(new Set());
  const [permissoes, setPermissoes] = useState<Set<string>>(new Set());
  const [guildId, setGuildId] = useState("");

  useEffect(() => {
    if (!pedido.data) return;
    setLigados(new Set(pedido.data.escopos));
    setPermissoes(new Set(pedido.data.bot.permissoesPedidas));
  }, [pedido.data]);

  useEffect(() => {
    if (!guildId && destinos.data?.destinos[0]) setGuildId(destinos.data.destinos[0].id);
  }, [destinos.data, guildId]);

  const autorizar = async () => {
    if (!pedido.data) return;
    setEnviando(true);
    setErro(null);

    try {
      const { data } = await api.post<{ codigo: string; redirectUri: string }>("/oauth2/autorizar", {
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: [...ligados].join(" "),
        ...(comBot ? { guild_id: guildId, permissions: [...permissoes] } : {}),
      });

      const destino = new URL(data.redirectUri);
      destino.searchParams.set("code", data.codigo);
      if (state) destino.searchParams.set("state", state);

      window.location.href = destino.toString();
    } catch (e) {
      setEnviando(false);
      setErro((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Não deu para autorizar.");
    }
  };

  if (pedido.isLoading) {
    return (
      <Moldura data-gc="bot.autorizar-app.moldura" titulo="Autorizar aplicativo" onFechar={() => navigate("/channels")}>
        <p data-gc="bot.autorizar-app.p" className="text-sm text-ink-faint">Carregando…</p>
      </Moldura>
    );
  }

  if (pedido.isError || !pedido.data) {
    return (
      <Moldura data-gc="bot.autorizar-app.moldura--2" titulo="Autorizar aplicativo" onFechar={() => navigate("/channels")}>
        <ShieldAlert data-gc="bot.autorizar-app.shield-alert" size={40} className="mx-auto text-ink-faint" />
        <h2 data-gc="bot.autorizar-app.h2" className="mt-4 text-center text-xl font-semibold">Pedido inválido</h2>
        <p data-gc="bot.autorizar-app.p--2" className="mt-2 text-center text-sm text-ink-muted">
          O endereço de retorno não está registrado nessa aplicação, ou o link veio errado. Não
          autorize nada por aqui.
        </p>
        <Button data-gc="bot.autorizar-app.button" className="mt-6 w-full" onClick={() => navigate("/channels")}>Voltar</Button>
      </Moldura>
    );
  }

  const { bot, escopos } = pedido.data;
  const host = new URL(pedido.data.redirectUri).host;
  const pedeAdmin = permissoes.has("ADMINISTRATOR");
  const ultimo = !comBot || passo === "destino";

  const avancar = () => {
    if (!comBot) return void autorizar();
    if (passo === "escopos") return setPasso("permissoes");
    if (passo === "permissoes") return setPasso("destino");
    return void autorizar();
  };
  const voltar = () => setPasso(passo === "destino" ? "permissoes" : "escopos");

  return (
    <Moldura data-gc="bot.autorizar-app.moldura--3" titulo="Autorizar aplicativo" onFechar={() => navigate("/channels")}>
      {passo === "escopos" && (
        <>
          <div data-gc="bot.autorizar-app.div" className="flex flex-col items-center text-center">
            <Avatar data-gc="bot.autorizar-app.avatar" id={bot.usuario.id} name={bot.usuario.displayName} url={bot.usuario.avatarUrl} size={56} />
            <h2 data-gc="bot.autorizar-app.h2--2" className="mt-3 text-lg font-semibold">{bot.usuario.displayName} quer se conectar</h2>
            <p data-gc="bot.autorizar-app.p--3" className="mt-1 text-sm text-ink-muted">Revise o que este aplicativo está pedindo antes de continuar.</p>
            {bot.descricao && <p data-gc="bot.autorizar-app.p--4" className="mt-2 text-xs text-ink-faint">{bot.descricao}</p>}
          </div>

          <div data-gc="bot.autorizar-app.div--2" className="mt-5 border-t border-line pt-4">
            <p data-gc="bot.autorizar-app.p--5" className="text-sm font-semibold">Permissões solicitadas</p>
            <p data-gc="bot.autorizar-app.p--6" className="mt-0.5 text-xs text-ink-faint">
              Desative o que você não se sentir à vontade. Alguns recursos podem parar de funcionar.
            </p>

            <ul data-gc="bot.autorizar-app.ul" className="mt-4 space-y-4">
              {escopos.map((id) => {
                const escopo = ESCOPOS_OAUTH.find((e) => e.id === id);
                if (!escopo || !ehEscopo(id)) return null;

                return (
                  <li data-gc="bot.autorizar-app.li" key={id} className="flex items-start justify-between gap-4">
                    <div data-gc="bot.autorizar-app.div--3" className="min-w-0">
                      <p data-gc="bot.autorizar-app.p--7" className="flex items-center gap-2 text-sm font-medium">
                        {id}
                        {escopo.obrigatorio && (
                          <span data-gc="bot.autorizar-app.span" className="rounded-full border border-line px-1.5 py-px text-10 text-ink-faint">Obrigatório</span>
                        )}
                      </p>
                      <p data-gc="bot.autorizar-app.p--8" className="mt-0.5 text-xs text-ink-muted">{escopo.descricao}</p>
                    </div>
                    <Switch data-gc="bot.autorizar-app.switch"
                      checked={ligados.has(id)}
                      disabled={escopo.obrigatorio}
                      onCheckedChange={(valor) =>
                        setLigados((atual) => {
                          const proximo = new Set(atual);
                          if (valor) proximo.add(id);
                          else proximo.delete(id);
                          return proximo;
                        })
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {passo === "permissoes" && (
        <>
          <div data-gc="bot.autorizar-app.div--4" className="text-center">
            <h2 data-gc="bot.autorizar-app.h2--3" className="text-lg font-semibold">Configurar permissões do bot</h2>
            <p data-gc="bot.autorizar-app.p--9" className="mt-1 text-sm text-ink-muted">
              Escolha o que {bot.usuario.displayName} pode fazer na sua comunidade. Desmarque as permissões que você não quer conceder.
            </p>
          </div>

          <ul data-gc="bot.autorizar-app.ul--2" className="mt-5 max-h-72 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
            {bot.permissoesPedidas.map((p) => (
              <li data-gc="bot.autorizar-app.li--2" key={p}>
                <label data-gc="bot.autorizar-app.label" className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition hover:bg-hover">
                  <Checkbox data-gc="bot.autorizar-app.checkbox"
                    checked={permissoes.has(p)}
                    onChange={(e) =>
                      setPermissoes((atual) => {
                        const proximo = new Set(atual);
                        if (e.target.checked) proximo.add(p);
                        else proximo.delete(p);
                        return proximo;
                      })
                    }
                  />
                  <span data-gc="bot.autorizar-app.span--2" className="min-w-0">
                    <span data-gc="bot.autorizar-app.span--3" className="block text-sm font-medium">{PERMISSION_LABELS[p]?.nome ?? p}</span>
                    <span data-gc="bot.autorizar-app.span--4" className="block text-xs text-ink-faint">{PERMISSION_LABELS[p]?.descricao}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {pedeAdmin && (
            <p data-gc="bot.autorizar-app.p--10" className="mt-4 rounded-lg border border-danger/60 bg-danger/10 p-3 text-sm text-ink">
              Este bot solicita permissão de administrador. Conceda-a apenas se você confiar totalmente no desenvolvedor.
              Peça para que solicite menos permissões. Feche esta página se não tiver certeza.
            </p>
          )}
        </>
      )}

      {passo === "destino" && (
        <>
          <div data-gc="bot.autorizar-app.div--5" className="text-center">
            <h2 data-gc="bot.autorizar-app.h2--4" className="text-lg font-semibold">Adicionar bot a um destino</h2>
            <p data-gc="bot.autorizar-app.p--11" className="mt-1 text-sm text-ink-muted">
              Selecione uma comunidade onde você possa conceder as permissões solicitadas.
            </p>
          </div>

          <div data-gc="bot.autorizar-app.div--6" className="mt-5">
            {destinos.data?.destinos.length ? (
              <CampoSelect data-gc="bot.autorizar-app.campo-select.set-guild-id"
                id="destino-do-bot"
                valor={guildId}
                onEscolher={setGuildId}
                opcoes={destinos.data.destinos.map((d) => ({ valor: d.id, rotulo: d.name }))}
              />
            ) : (
              <p data-gc="bot.autorizar-app.p--12" className="rounded-lg bg-surface-0 p-3 text-sm text-ink-muted">
                Você não gerencia nenhuma comunidade onde o bot ainda não esteja.
              </p>
            )}
          </div>
        </>
      )}

      {erro && <p data-gc="bot.autorizar-app.p--13" className="mt-4 text-sm text-danger">{erro}</p>}

      <p data-gc="bot.autorizar-app.p--14" className="mt-5 text-xs text-ink-faint">
        Você será direcionado para <span data-gc="bot.autorizar-app.span--5" className="text-ink-muted">{host}</span> após a autorização.
      </p>

      <div data-gc="bot.autorizar-app.div--7" className="mt-4 flex justify-end gap-2">
        {passo === "escopos" ? (
          <Button data-gc="bot.autorizar-app.button--2" variant="surface" onClick={() => navigate("/channels")}>Cancelar</Button>
        ) : (
          <Button data-gc="bot.autorizar-app.button.voltar" variant="surface" onClick={voltar}>Voltar</Button>
        )}
        <Button data-gc="bot.autorizar-app.button.avancar"
          disabled={enviando || (passo === "destino" && !guildId)}
          onClick={avancar}
        >
          {ultimo ? (enviando ? "Autorizando…" : "Autorizar") : "Próximo"}
        </Button>
      </div>
    </Moldura>
  );
};

const Moldura: React.FC<{ titulo: string; onFechar: () => void; children: React.ReactNode }> = ({ titulo, onFechar, children }) => (
  <main data-gc="bot.autorizar-app.main" className="flex min-h-dvh items-center justify-center bg-surface-0 p-4">
    <div data-gc="bot.autorizar-app.div--8" className={cn("w-full max-w-md rounded-lg bg-surface-1 shadow-2xl")}>
      <div data-gc="bot.autorizar-app.div--9" className="flex items-center justify-between border-b border-line px-5 py-4">
        <h1 data-gc="bot.autorizar-app.h1" className="text-base font-semibold">{titulo}</h1>
        <button data-gc="bot.autorizar-app.button.on-fechar" type="button" onClick={onFechar} aria-label="Fechar" className="text-ink-faint transition hover:text-ink">
          <X data-gc="bot.autorizar-app.x" size={18} />
        </button>
      </div>
      <div data-gc="bot.autorizar-app.div--10" className="p-5">{children}</div>
    </div>
  </main>
);
