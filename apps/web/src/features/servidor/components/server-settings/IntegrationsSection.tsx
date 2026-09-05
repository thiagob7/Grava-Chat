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
    <div data-gc="servidor.server-settings.integrations-section.div" className="max-w-2xl pb-10">
      <header data-gc="servidor.server-settings.integrations-section.header" className="flex items-start gap-4">
        <div data-gc="servidor.server-settings.integrations-section.div--2" className="flex-1">
          <h2 data-gc="servidor.server-settings.integrations-section.h2" className="text-xl font-semibold">{t("servidor.integracoes.titulo")}</h2>
          <p data-gc="servidor.server-settings.integrations-section.p" className="mt-1 text-sm text-ink-muted">
            {t("servidor.integracoes.descricao")}
          </p>
        </div>

        <Button data-gc="servidor.server-settings.integrations-section.button"
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
          <Plus data-gc="servidor.server-settings.integrations-section.plus" size={16} /> {t("servidor.integracoes.novo")}
        </Button>
      </header>

      <div data-gc="servidor.server-settings.integrations-section.div--3" className="mt-6 space-y-3">
        {isLoading && <p data-gc="servidor.server-settings.integrations-section.p--2" className="text-sm text-ink-faint">{t("comum.carregando")}</p>}

        {!isLoading && !webhooks.length && (
          <div data-gc="servidor.server-settings.integrations-section.div--4" className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
            <WebhookIcon data-gc="servidor.server-settings.integrations-section.webhook-icon" size={28} className="mx-auto text-ink-faint" />
            <p data-gc="servidor.server-settings.integrations-section.p--3" className="mt-3 text-sm text-ink-muted">
              {t("servidor.integracoes.vazio")}
            </p>
          </div>
        )}

        {webhooks.map((webhook) => (
          <CartaoDoWebhook data-gc="servidor.server-settings.integrations-section.cartao-do-webhook"
            key={webhook.id}
            guildId={guildId}
            webhook={webhook}
            canais={canaisDeTexto}
          />
        ))}
      </div>

      {webhooks.length > 0 && <ComoUsar data-gc="servidor.server-settings.integrations-section.como-usar" exemplo={webhooks[0]!.url} />}
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
    <div data-gc="servidor.server-settings.integrations-section.div--5" className="rounded-lg bg-surface-1 p-4">
      <div data-gc="servidor.server-settings.integrations-section.div--6" className="flex items-center gap-3">
        <Avatar data-gc="servidor.server-settings.integrations-section.avatar"
          id={webhook.bot.id}
          name={nome || webhook.name}
          url={webhook.avatarUrl}
          size={40}
        />

        <div data-gc="servidor.server-settings.integrations-section.div--7" className="grid flex-1 grid-cols-2 gap-3">
          <label data-gc="servidor.server-settings.integrations-section.label" className="block">
            <span data-gc="servidor.server-settings.integrations-section.span" className="mb-1 block text-11 font-semibold uppercase tracking-wide text-ink-faint">
              {t("comum.nome")}
            </span>
            <Input data-gc="servidor.server-settings.integrations-section.input"
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

          <label data-gc="servidor.server-settings.integrations-section.label--2" className="block">
            <span data-gc="servidor.server-settings.integrations-section.span--2" className="mb-1 block text-11 font-semibold uppercase tracking-wide text-ink-faint">
              {t("servidor.integracoes.canal")}
            </span>
            <CampoSelect data-gc="servidor.server-settings.integrations-section.campo-select"
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

        <button data-gc="servidor.server-settings.integrations-section.button--2"
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
          <Trash2 data-gc="servidor.server-settings.integrations-section.trash2" size={18} />
        </button>
      </div>

      <div data-gc="servidor.server-settings.integrations-section.div--8" className="mt-3 flex items-center gap-2">
        <code data-gc="servidor.server-settings.integrations-section.code"
          className={cn(
            "min-w-0 flex-1 truncate rounded bg-surface-0 px-3 py-2 text-xs",
            mostrandoUrl ? "text-ink-muted" : "text-ink-faint",
          )}
        >
          {mostrandoUrl
            ? webhook.url
            : webhook.url.replace(/\/[^/]+$/, "/••••••••••••••••")}
        </code>

        <button data-gc="servidor.server-settings.integrations-section.button--3"
          onClick={() => setMostrandoUrl((v) => !v)}
          title={mostrandoUrl ? "Esconder" : "Mostrar"}
          className="rounded p-2 text-ink-muted transition hover:bg-surface-0 hover:text-ink"
        >
          {mostrandoUrl ? <EyeOff data-gc="servidor.server-settings.integrations-section.eye-off" size={16} /> : <Eye data-gc="servidor.server-settings.integrations-section.eye" size={16} />}
        </button>

        <Button data-gc="servidor.server-settings.integrations-section.button--4" variant="surface" size="sm" onClick={() => void copiar()}>
          {copiado ? <Check data-gc="servidor.server-settings.integrations-section.check" size={14} /> : <Copy data-gc="servidor.server-settings.integrations-section.copy" size={14} />}
          {copiado ? "Copiado" : "Copiar URL"}
        </Button>
      </div>

      <p data-gc="servidor.server-settings.integrations-section.p--4" className="mt-2 text-xs text-ink-faint">
        Quem tem essa URL posta neste canal — trate como senha. Criado por{" "}
        {webhook.createdBy.displayName}.
      </p>
    </div>
  );
};

const ComoUsar: React.FC<{ exemplo: string }> = ({ exemplo }) => {
  const { t } = useTranslation();

  return (
  <section data-gc="servidor.server-settings.integrations-section.section" className="mt-8">
    <h3 data-gc="servidor.server-settings.integrations-section.h3" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
      {t("servidor.integracoes.comoUsar")}
    </h3>
    <p data-gc="servidor.server-settings.integrations-section.p--5" className="mt-2 text-sm text-ink-muted">
      {t("servidor.integracoes.comoUsarTexto")}
    </p>

    <pre data-gc="servidor.server-settings.integrations-section.pre" className="mt-3 overflow-x-auto rounded bg-surface-0 p-4 text-xs text-ink-muted">
      {`curl -X POST ${exemplo.replace(/\/[^/]+$/, "/SEU_TOKEN")} \\
  -H "Content-Type: application/json" \\
  -d '{"content": "build 42 passou ✅", "username": "CI"}'`}
    </pre>

    <p data-gc="servidor.server-settings.integrations-section.p--6" className="mt-2 text-xs text-ink-faint">
      {t("servidor.integracoes.opcionais")}
    </p>
  </section>
  );
};
