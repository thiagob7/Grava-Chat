import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, X } from "lucide-react";
import { SCOPES_OAUTH, PERMISSION_LABELS, isScope, type ScopeAuth, type Permission } from "@gravae/shared";

import { useBotDestinations } from "~/@core/application/queries/bot/use-bots";
import { api } from "~/@core/lib/api";
import { Button } from "~/components/ui/button";
import { BrandBackground } from "~/features/app/components/FundoDaMarca";
import { Checkbox } from "~/components/ui/checkbox";
import { SelectField } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Avatar } from "~/features/perfil/components/Avatar";
import { cn } from "~/lib/utils";

interface RequestModel {
  bot: {
    id: string;
    user: { id: string; displayName: string; username: string; avatarUrl: string | null };
    description: string | null;
    permissionsRequested: Permission[];
  };
  scopes: ScopeAuth[];
  redirectUri: string;
}

type Step = "escopos" | "permissoes" | "destino";

export const AuthorizeApp: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const scope = params.get("scope") ?? "identify";
  const state = params.get("state") ?? "";

  const request = useQuery({
    queryKey: ["oauth-pedido", clientId, redirectUri, scope],
    queryFn: async () => {
      const { data } = await api.get<RequestModel>("/oauth2/pedido", {
        params: { client_id: clientId, redirect_uri: redirectUri, scope },
      });
      return data;
    },
    enabled: Boolean(clientId && redirectUri),
    retry: false,
  });

  const withBot = request.data?.scopes.includes("bot") ?? false;
  const destinations = useBotDestinations(withBot ? request.data?.bot.id : undefined);

  const [step, setStep] = useState<Step>("escopos");
  const [on, setOn] = useState<Set<string>>(new Set());
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [guildId, setGuildId] = useState("");

  useEffect(() => {
    if (!request.data) return;
    setOn(new Set(request.data.scopes));
    setPermissions(new Set(request.data.bot.permissionsRequested));
  }, [request.data]);

  useEffect(() => {
    if (!guildId && destinations.data?.destinations[0]) setGuildId(destinations.data.destinations[0].id);
  }, [destinations.data, guildId]);

  const authorize = async () => {
    if (!request.data) return;
    setSending(true);
    setError(null);

    try {
      const { data } = await api.post<{ code: string; redirectUri: string }>("/oauth2/autorizar", {
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: [...on].join(" "),
        ...(withBot ? { guild_id: guildId, permissions: [...permissions] } : {}),
      });

      const destination = new URL(data.redirectUri);
      destination.searchParams.set("code", data.code);
      if (state) destination.searchParams.set("state", state);

      window.location.href = destination.toString();
    } catch (e) {
      setSending(false);
      setError((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Não deu para autorizar.");
    }
  };

  if (request.isLoading) {
    return (
      <Frame data-gc="bot.autorizar-app.frame" title="Autorizar aplicativo" onClose={() => navigate("/channels")}>
        <p data-gc="bot.autorizar-app.p" className="text-sm text-ink-faint">Carregando…</p>
      </Frame>
    );
  }

  if (request.isError || !request.data) {
    return (
      <Frame data-gc="bot.autorizar-app.frame--2" title="Autorizar aplicativo" onClose={() => navigate("/channels")}>
        <ShieldAlert data-gc="bot.autorizar-app.shield-alert" size={40} className="mx-auto text-ink-faint" />
        <h2 data-gc="bot.autorizar-app.h2" className="mt-4 text-center text-xl font-semibold">Pedido inválido</h2>
        <p data-gc="bot.autorizar-app.p--2" className="mt-2 text-center text-sm text-ink-muted">
          O endereço de retorno não está registrado nessa aplicação, ou o link veio errado. Não
          autorize nada por aqui.
        </p>
        <Button data-gc="bot.autorizar-app.button" className="mt-6 w-full" onClick={() => navigate("/channels")}>Voltar</Button>
      </Frame>
    );
  }

  const { bot, scopes } = request.data;
  const host = new URL(request.data.redirectUri).host;
  const asksAdmin = permissions.has("ADMINISTRATOR");
  const last = !withBot || step === "destino";

  const advance = () => {
    if (!withBot) return void authorize();
    if (step === "escopos") return setStep("permissoes");
    if (step === "permissoes") return setStep("destino");
    return void authorize();
  };
  const back = () => setStep(step === "destino" ? "permissoes" : "escopos");

  return (
    <Frame data-gc="bot.autorizar-app.frame--3" title="Autorizar aplicativo" onClose={() => navigate("/channels")}>
      {step === "escopos" && (
        <>
          <div data-gc="bot.autorizar-app.div" className="flex flex-col items-center text-center">
            <Avatar data-gc="bot.autorizar-app.avatar" id={bot.user.id} name={bot.user.displayName} url={bot.user.avatarUrl} size={56} />
            <h2 data-gc="bot.autorizar-app.h2--2" className="mt-3 text-lg font-semibold">{bot.user.displayName} quer se conectar</h2>
            <p data-gc="bot.autorizar-app.p--3" className="mt-1 text-sm text-ink-muted">Revise o que este aplicativo está pedindo antes de continuar.</p>
            {bot.description && <p data-gc="bot.autorizar-app.p--4" className="mt-2 text-xs text-ink-faint">{bot.description}</p>}
          </div>

          <div data-gc="bot.autorizar-app.div--2" className="mt-5 border-t border-line pt-4">
            <p data-gc="bot.autorizar-app.p--5" className="text-sm font-semibold">Permissões solicitadas</p>
            <p data-gc="bot.autorizar-app.p--6" className="mt-0.5 text-xs text-ink-faint">
              Desative o que você não se sentir à vontade. Alguns recursos podem parar de funcionar.
            </p>

            <ul data-gc="bot.autorizar-app.ul" className="mt-4 space-y-4">
              {scopes.map((id) => {
                const scope = SCOPES_OAUTH.find((e) => e.id === id);
                if (!scope || !isScope(id)) return null;

                return (
                  <li data-gc="bot.autorizar-app.li" key={id} className="flex items-start justify-between gap-4">
                    <div data-gc="bot.autorizar-app.div--3" className="min-w-0">
                      <p data-gc="bot.autorizar-app.p--7" className="flex items-center gap-2 text-sm font-medium">
                        {id}
                        {scope.required && (
                          <span data-gc="bot.autorizar-app.span" className="rounded-full border border-line px-1.5 py-px text-10 text-ink-faint">Obrigatório</span>
                        )}
                      </p>
                      <p data-gc="bot.autorizar-app.p--8" className="mt-0.5 text-xs text-ink-muted">{scope.description}</p>
                    </div>
                    <Switch data-gc="bot.autorizar-app.switch"
                      checked={on.has(id)}
                      disabled={scope.required}
                      onCheckedChange={(value) =>
                        setOn((current) => {
                          const next = new Set(current);
                          if (value) next.add(id);
                          else next.delete(id);
                          return next;
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

      {step === "permissoes" && (
        <>
          <div data-gc="bot.autorizar-app.div--4" className="text-center">
            <h2 data-gc="bot.autorizar-app.h2--3" className="text-lg font-semibold">Configurar permissões do bot</h2>
            <p data-gc="bot.autorizar-app.p--9" className="mt-1 text-sm text-ink-muted">
              Escolha o que {bot.user.displayName} pode fazer na sua comunidade. Desmarque as permissões que você não quer conceder.
            </p>
          </div>

          <ul data-gc="bot.autorizar-app.ul--2" className="mt-5 max-h-72 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
            {bot.permissionsRequested.map((p) => (
              <li data-gc="bot.autorizar-app.li--2" key={p}>
                <label data-gc="bot.autorizar-app.label" className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition hover:bg-hover">
                  <Checkbox data-gc="bot.autorizar-app.checkbox"
                    checked={permissions.has(p)}
                    onChange={(e) =>
                      setPermissions((current) => {
                        const next = new Set(current);
                        if (e.target.checked) next.add(p);
                        else next.delete(p);
                        return next;
                      })
                    }
                  />
                  <span data-gc="bot.autorizar-app.span--2" className="min-w-0">
                    <span data-gc="bot.autorizar-app.span--3" className="block text-sm font-medium">{PERMISSION_LABELS[p]?.name ?? p}</span>
                    <span data-gc="bot.autorizar-app.span--4" className="block text-xs text-ink-faint">{PERMISSION_LABELS[p]?.description}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {asksAdmin && (
            <p data-gc="bot.autorizar-app.p--10" className="mt-4 rounded-lg border border-danger/60 bg-danger/10 p-3 text-sm text-ink">
              Este bot solicita permissão de administrador. Conceda-a apenas se você confiar totalmente no desenvolvedor.
              Peça para que solicite menos permissões. Feche esta página se não tiver certeza.
            </p>
          )}
        </>
      )}

      {step === "destino" && (
        <>
          <div data-gc="bot.autorizar-app.div--5" className="text-center">
            <h2 data-gc="bot.autorizar-app.h2--4" className="text-lg font-semibold">Adicionar bot a um destino</h2>
            <p data-gc="bot.autorizar-app.p--11" className="mt-1 text-sm text-ink-muted">
              Selecione uma comunidade onde você possa conceder as permissões solicitadas.
            </p>
          </div>

          <div data-gc="bot.autorizar-app.div--6" className="mt-5">
            {destinations.data?.destinations.length ? (
              <SelectField data-gc="bot.autorizar-app.select-field.set-guild-id"
                id="destino-do-bot"
                value={guildId}
                onSelect={setGuildId}
                options={destinations.data.destinations.map((d) => ({ value: d.id, label: d.name }))}
              />
            ) : (
              <p data-gc="bot.autorizar-app.p--12" className="rounded-lg bg-surface-0 p-3 text-sm text-ink-muted">
                Você não gerencia nenhuma comunidade onde o bot ainda não esteja.
              </p>
            )}
          </div>
        </>
      )}

      {error && <p data-gc="bot.autorizar-app.p--13" className="mt-4 text-sm text-danger">{error}</p>}

      <p data-gc="bot.autorizar-app.p--14" className="mt-5 text-xs text-ink-faint">
        Você será direcionado para <span data-gc="bot.autorizar-app.span--5" className="text-ink-muted">{host}</span> após a autorização.
      </p>

      <div data-gc="bot.autorizar-app.div--7" className="mt-4 flex justify-end gap-2">
        {step === "escopos" ? (
          <Button data-gc="bot.autorizar-app.button--2" variant="surface" onClick={() => navigate("/channels")}>Cancelar</Button>
        ) : (
          <Button data-gc="bot.autorizar-app.button.back" variant="surface" onClick={back}>Voltar</Button>
        )}
        <Button data-gc="bot.autorizar-app.button.advance"
          disabled={sending || (step === "destino" && !guildId)}
          onClick={advance}
        >
          {last ? (sending ? "Autorizando…" : "Autorizar") : "Próximo"}
        </Button>
      </div>
    </Frame>
  );
};

const Frame: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <main data-gc="bot.autorizar-app.main" className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-surface-0 p-4">
    <BrandBackground data-gc="bot.autorizar-app.brand-background" className="pointer-events-none absolute inset-0" />
    <div data-gc="bot.autorizar-app.div--8" className={cn("relative w-full max-w-md rounded-xl bg-surface-1 shadow-2xl ring-1 ring-line-sutil")}>
      <div data-gc="bot.autorizar-app.div--9" className="flex items-center justify-between border-b border-line px-5 py-4">
        <h1 data-gc="bot.autorizar-app.h1" className="text-base font-semibold">{title}</h1>
        <button data-gc="bot.autorizar-app.button.on-close" type="button" onClick={onClose} aria-label="Fechar" className="text-ink-faint transition hover:text-ink">
          <X data-gc="bot.autorizar-app.x" size={18} />
        </button>
      </div>
      <div data-gc="bot.autorizar-app.div--10" className="p-5">{children}</div>
    </div>
  </main>
);
