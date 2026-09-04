import React, { useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Webhook as WebhookIcon,
} from "lucide-react";
import type { Channel } from "@gravae/shared";

import {
  useCreateWebhook,
  useDeleteWebhook,
  useFindWebhooks,
  useUpdateWebhook,
} from "~/@core/application/queries/webhook/use-webhooks";
import type { WebhookModel } from "~/@core/domain/models/guild-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { CampoSelect } from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { useConfirmar } from "~/components/ui/confirm";
import { copiarTexto } from "~/lib/copiar";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface IntegrationsSectionProps {
  guildId: string;
  channels: Channel[];
}

export const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({
  guildId,
  channels,
}) => {
  const { t } = useTranslation();
  const { data: webhooks = [], isLoading } = useFindWebhooks(guildId);
  const criar = useCreateWebhook(guildId);

  const canaisDeTexto = channels.filter(
    (c) => c.type === "TEXT" || c.type === "FORUM",
  );

  return (
    <div className="max-w-2xl pb-10">
      <header className="flex items-start gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{t("servidor.integracoes.titulo")}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t("servidor.integracoes.descricao")}
          </p>
        </div>

        <Button
          size="sm"
          disabled={criar.isPending || !canaisDeTexto.length}
          onClick={() =>
            criar.mutate({
              guildId,
              name: "Webhook",
              channelId: canaisDeTexto[0]!.id,
            })
          }
        >
          <Plus size={16} /> {t("servidor.integracoes.novo")}
        </Button>
      </header>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-ink-faint">{t("comum.carregando")}</p>}

        {!isLoading && !webhooks.length && (
          <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
            <WebhookIcon size={28} className="mx-auto text-ink-faint" />
            <p className="mt-3 text-sm text-ink-muted">
              {t("servidor.integracoes.vazio")}
            </p>
          </div>
        )}

        {webhooks.map((webhook) => (
          <CartaoDoWebhook
            key={webhook.id}
            guildId={guildId}
            webhook={webhook}
            canais={canaisDeTexto}
          />
        ))}
      </div>

      {webhooks.length > 0 && <ComoUsar exemplo={webhooks[0]!.url} />}
    </div>
  );
};

interface CartaoProps {
  guildId: string;
  webhook: WebhookModel;
  canais: Channel[];
}

const CartaoDoWebhook: React.FC<CartaoProps> = ({
  guildId,
  webhook,
  canais,
}) => {
  const { t } = useTranslation();
  const salvar = useUpdateWebhook(guildId);
  const apagar = useDeleteWebhook(guildId);

  const [nome, setNome] = useState(webhook.name);
  const [mostrandoUrl, setMostrandoUrl] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const confirmar = useConfirmar();

  const copiar = async () => {
    await copiarTexto(webhook.url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="rounded-lg bg-surface-1 p-4">
      <div className="flex items-center gap-3">
        <Avatar
          id={webhook.bot.id}
          name={nome || webhook.name}
          url={webhook.avatarUrl}
          size={40}
        />

        <div className="grid flex-1 grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-11 font-semibold uppercase tracking-wide text-ink-faint">
              {t("comum.nome")}
            </span>
            <Input
              value={nome}
              maxLength={48}
              onChange={(e) => setNome(e.target.value)}
              onBlur={() => {
                if (nome.trim() && nome !== webhook.name) {
                  salvar.mutate({
                    guildId,
                    webhookId: webhook.id,
                    name: nome.trim(),
                  });
                }
              }}
              className="py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-11 font-semibold uppercase tracking-wide text-ink-faint">
              {t("servidor.integracoes.canal")}
            </span>
            <CampoSelect
              valor={webhook.channelId}
              onEscolher={(channelId) =>
                salvar.mutate({ guildId, webhookId: webhook.id, channelId })
              }
              opcoes={canais.map((canal) => ({
                valor: canal.id,
                rotulo: `#${canal.name}`,
              }))}
            />
          </label>
        </div>

        <button
          onClick={() =>
            void confirmar({
              titulo: `Apagar webhook "${webhook.name}"?`,
              descricao:
                t("servidor.integracoes.apagarDescricao"),
              acao: t("servidor.integracoes.apagar"),
            }).then(
              ({ confirmado }) =>
                confirmado && apagar.mutate({ guildId, webhookId: webhook.id }),
            )
          }
          title={t("servidor.integracoes.apagar")}
          className="rounded p-2 text-ink-muted transition hover:bg-surface-0 hover:text-danger"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <code
          className={cn(
            "min-w-0 flex-1 truncate rounded bg-surface-0 px-3 py-2 text-xs",
            mostrandoUrl ? "text-ink-muted" : "text-ink-faint",
          )}
        >
          {mostrandoUrl
            ? webhook.url
            : webhook.url.replace(/\/[^/]+$/, "/••••••••••••••••")}
        </code>

        <button
          onClick={() => setMostrandoUrl((v) => !v)}
          title={mostrandoUrl ? "Esconder" : "Mostrar"}
          className="rounded p-2 text-ink-muted transition hover:bg-surface-0 hover:text-ink"
        >
          {mostrandoUrl ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>

        <Button variant="surface" size="sm" onClick={() => void copiar()}>
          {copiado ? <Check size={14} /> : <Copy size={14} />}
          {copiado ? "Copiado" : "Copiar URL"}
        </Button>
      </div>

      <p className="mt-2 text-xs text-ink-faint">
        Quem tem essa URL posta neste canal — trate como senha. Criado por{" "}
        {webhook.createdBy.displayName}.
      </p>
    </div>
  );
};

const ComoUsar: React.FC<{ exemplo: string }> = ({ exemplo }) => {
  const { t } = useTranslation();

  return (
  <section className="mt-8">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
      {t("servidor.integracoes.comoUsar")}
    </h3>
    <p className="mt-2 text-sm text-ink-muted">
      {t("servidor.integracoes.comoUsarTexto")}
    </p>

    <pre className="mt-3 overflow-x-auto rounded bg-surface-0 p-4 text-xs text-ink-muted">
      {`curl -X POST ${exemplo.replace(/\/[^/]+$/, "/SEU_TOKEN")} \\
  -H "Content-Type: application/json" \\
  -d '{"content": "build 42 passou ✅", "username": "CI"}'`}
    </pre>

    <p className="mt-2 text-xs text-ink-faint">
      {t("servidor.integracoes.opcionais")}
    </p>
  </section>
  );
};
