import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Check, Flag, Hash, IdCard, Link2, MoreHorizontal, Users } from "lucide-react";
import { PERMISSION_LABELS, type Permission } from "@gravae/shared";

import {
  useApp,
  useReportApp,
} from "~/@core/application/queries/descoberta/use-aplicativo";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { BrandBackground } from "~/features/app/components/FundoDaMarca";
import { Input, Label } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";
import { copyText } from "~/lib/copiar";
import { formatTimestamp } from "~/lib/format";
import { LANGUAGES, useTranslation } from "~/traducao";

const REASONS = ["spam", "assedio", "conteudo", "golpe", "outro"] as const;

export const AppPublic: React.FC<{ botId: string }> = ({ botId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: app, isLoading, isError } = useApp(botId);
  const [reporting, setReporting] = useState(false);

  if (isLoading) {
    return (
      <div data-gc="bot.aplicativo-publico.div" className="flex h-full items-center justify-center">
        <p data-gc="bot.aplicativo-publico.p" className="text-sm text-ink-faint">{t("comum.carregando")}</p>
      </div>
    );
  }

  if (isError || !app) {
    return (
      <div data-gc="bot.aplicativo-publico.div--2" className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 data-gc="bot.aplicativo-publico.h1" className="text-xl font-semibold">{t("servidor.descoberta.appIndisponivel")}</h1>
        <Button data-gc="bot.aplicativo-publico.button" variant="surface" onClick={() => navigate("/explorar")}>
          {t("servidor.descoberta.voltarParaExplorar")}
        </Button>
      </div>
    );
  }

  return (
    <div data-gc="bot.aplicativo-publico.div--3" className="pb-16">
      <div data-gc="bot.aplicativo-publico.div--4" className="relative h-36 overflow-hidden rounded-xl sm:h-44">
        {app.coverUrl ? (
          <img data-gc="bot.aplicativo-publico.img" src={app.coverUrl} alt="" className="size-full object-cover" />
        ) : (
          <BrandBackground data-gc="bot.aplicativo-publico.brand-background" className="pointer-events-none absolute inset-0" />
        )}
      </div>

      <div data-gc="bot.aplicativo-publico.div--5" className="-mt-12 px-2">
        <div data-gc="bot.aplicativo-publico.div--6" className="flex flex-wrap items-end justify-between gap-4">
          <div data-gc="bot.aplicativo-publico.div--7" className="flex items-end gap-4">
            <span data-gc="bot.aplicativo-publico.span" className="rounded-2xl border-4 border-surface-0 bg-surface-0">
              <Avatar data-gc="bot.aplicativo-publico.avatar" id={app.userId} name={app.name} url={app.avatarUrl} size={96} />
            </span>

            <div data-gc="bot.aplicativo-publico.div--8" className="min-w-0 pb-1">
              <h1 data-gc="bot.aplicativo-publico.h1--2" className="truncate text-2xl font-bold">{app.name}</h1>
              <p data-gc="bot.aplicativo-publico.p--2" className="truncate text-sm text-ink-faint">@{app.username}</p>

              {app.categories.length > 0 && (
                <div data-gc="bot.aplicativo-publico.div--9" className="mt-2 flex flex-wrap gap-1.5">
                  {app.categories.map((category) => (
                    <button data-gc="bot.aplicativo-publico.button--2"
                      key={category}
                      type="button"
                      onClick={() => navigate(`/explorar?categoria=${category}`)}
                      className="rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-medium text-ink-muted transition hover:text-ink"
                    >
                      {t(`servidor.descoberta.categoria.${category}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div data-gc="bot.aplicativo-publico.div--10" className="flex items-center gap-2 pb-1">
            <Button data-gc="bot.aplicativo-publico.button--3" onClick={() => navigate(`/bots/${app.id}/adicionar`)}>
              {t("servidor.descoberta.adicionarApp")}
            </Button>

            <button data-gc="bot.aplicativo-publico.button--4"
              type="button"
              onClick={() => void copyText(`${window.location.origin}/apps/${app.id}`)}
              aria-label={t("servidor.descoberta.copiarLink")}
              title={t("servidor.descoberta.copiarLink")}
              className="flex size-9 items-center justify-center rounded-md bg-surface-2 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
            >
              <Link2 data-gc="bot.aplicativo-publico.link2" size={16} />
            </button>

            <DropdownMenu data-gc="bot.aplicativo-publico.dropdown-menu">
              <DropdownMenuTrigger data-gc="bot.aplicativo-publico.dropdown-menu-trigger" asChild>
                <button data-gc="bot.aplicativo-publico.button--5"
                  type="button"
                  aria-label={t("comum.mais")}
                  className="flex size-9 items-center justify-center rounded-md bg-surface-2 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
                >
                  <MoreHorizontal data-gc="bot.aplicativo-publico.more-horizontal" size={16} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent data-gc="bot.aplicativo-publico.dropdown-menu-content" align="end">
                <DropdownMenuItem data-gc="bot.aplicativo-publico.dropdown-menu-item" danger onSelect={() => setReporting(true)}>
                  {t("servidor.descoberta.denunciarApp")} <Flag data-gc="bot.aplicativo-publico.flag" size={14} />
                </DropdownMenuItem>

                <DropdownMenuItem data-gc="bot.aplicativo-publico.dropdown-menu-item--2" onSelect={() => void copyText(app.id)}>
                  {t("servidor.descoberta.copiarIdDoApp")} <IdCard data-gc="bot.aplicativo-publico.id-card" size={14} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div data-gc="bot.aplicativo-publico.div--11" className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_260px]">
          <div data-gc="bot.aplicativo-publico.div--12" className="min-w-0 space-y-10">
            <section data-gc="bot.aplicativo-publico.section">
              <h2 data-gc="bot.aplicativo-publico.h2" className="text-lg font-bold">{t("servidor.descoberta.visaoGeral")}</h2>
              <p data-gc="bot.aplicativo-publico.p--3" className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                {app.description || t("servidor.descoberta.semDescricao")}
              </p>
            </section>

            {app.listCommands.length > 0 && (
              <section data-gc="bot.aplicativo-publico.section--2">
                <h2 data-gc="bot.aplicativo-publico.h2--2" className="text-lg font-bold">{t("servidor.descoberta.comandos")}</h2>

                <ul data-gc="bot.aplicativo-publico.ul" className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface-1">
                  {app.listCommands.map((command) => (
                    <li data-gc="bot.aplicativo-publico.li" key={command.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
                      <code data-gc="bot.aplicativo-publico.code" className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-xs text-ink">
                        /{command.name}
                      </code>
                      <span data-gc="bot.aplicativo-publico.span--2" className="min-w-0 flex-1 text-sm text-ink-muted">{command.description}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section data-gc="bot.aplicativo-publico.section--3">
              <h2 data-gc="bot.aplicativo-publico.h2--3" className="text-lg font-bold">{t("servidor.descoberta.permissoes")}</h2>

              {app.permissionsRequested.length ? (
                <ul data-gc="bot.aplicativo-publico.ul--2" className="mt-3 grid gap-2 rounded-lg border border-line bg-surface-1 p-4 sm:grid-cols-2">
                  {app.permissionsRequested.map((permission) => (
                    <li data-gc="bot.aplicativo-publico.li--2" key={permission} className="flex items-start gap-2 text-sm text-ink-muted">
                      <Check data-gc="bot.aplicativo-publico.check" size={14} className="mt-0.5 shrink-0 text-online" />

                      <span data-gc="bot.aplicativo-publico.span--3" className="min-w-0">
                        <span data-gc="bot.aplicativo-publico.span--4" className="block text-ink">
                          {PERMISSION_LABELS[permission as Permission]?.name ?? permission}
                        </span>
                        {PERMISSION_LABELS[permission as Permission]?.description && (
                          <span data-gc="bot.aplicativo-publico.span--5" className="block text-xs text-ink-faint">
                            {PERMISSION_LABELS[permission as Permission]!.description}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p data-gc="bot.aplicativo-publico.p--4" className="mt-3 text-sm text-ink-muted">
                  {t("servidor.descoberta.semPermissoes")}
                </p>
              )}

              <p data-gc="bot.aplicativo-publico.p--5" className="mt-3 text-xs leading-relaxed text-ink-faint">
                {t("servidor.descoberta.avisoDePermissoes")}
              </p>
            </section>
          </div>

          <aside data-gc="bot.aplicativo-publico.aside" className="space-y-6 text-sm">
            {app.serversCommon > 0 && (
              <Dado data-gc="bot.aplicativo-publico.dado"
                title={t("servidor.descoberta.servidoresEmComum")}
                icon={<Users data-gc="bot.aplicativo-publico.users" size={14} />}
              >
                {app.serversCommon === 1
                  ? t("servidor.descoberta.umServidorEmComum")
                  : t("servidor.descoberta.quantosServidoresEmComum", { quantos: app.serversCommon })}
              </Dado>
            )}

            {app.commands > 0 && (
              <Dado data-gc="bot.aplicativo-publico.dado--2"
                title={t("servidor.descoberta.comandos")}
                icon={<Hash data-gc="bot.aplicativo-publico.hash" size={14} />}
              >
                {app.commands}
              </Dado>
            )}

            {app.servers > 0 && (
              <Dado data-gc="bot.aplicativo-publico.dado--3"
                title={t("servidor.descoberta.emQuantosServidores")}
                icon={<Users data-gc="bot.aplicativo-publico.users--2" size={14} />}
              >
                {app.servers}
              </Dado>
            )}

            {app.languages.length > 0 && (
              <Dado data-gc="bot.aplicativo-publico.dado--4" title={t("servidor.descoberta.idiomas")}>
                {app.languages
                  .map((lng) => LANGUAGES.find((language) => language.lng === lng)?.native ?? lng)
                  .join(", ")}
              </Dado>
            )}

            {app.supportServer && (
              <Dado data-gc="bot.aplicativo-publico.dado--5" title={t("servidor.descoberta.servidorDeSuporte")}>
                <button data-gc="bot.aplicativo-publico.button--6"
                  type="button"
                  onClick={() => navigate(`/channels/${app.supportServer!.id}`)}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface-1 p-2.5 text-left transition hover:bg-surface-2"
                >
                  <Avatar data-gc="bot.aplicativo-publico.avatar--2"
                    id={app.supportServer.id}
                    name={app.supportServer.name}
                    url={app.supportServer.iconUrl}
                    size={32}
                  />
                  <span data-gc="bot.aplicativo-publico.span--6" className="min-w-0 flex-1">
                    <span data-gc="bot.aplicativo-publico.span--7" className="block truncate text-sm text-ink">
                      {app.supportServer.name}
                    </span>
                    <span data-gc="bot.aplicativo-publico.span--8" className="block text-xs text-ink-faint">
                      {t("servidor.descoberta.membros", { quantos: app.supportServer.members })}
                    </span>
                  </span>
                </button>
              </Dado>
            )}

            {(app.termsUrl || app.policyUrl) && (
              <Dado data-gc="bot.aplicativo-publico.dado--6" title={t("servidor.descoberta.politicas")}>
                <span data-gc="bot.aplicativo-publico.span--9" className="flex flex-col gap-1">
                  {app.termsUrl && (
                    <a data-gc="bot.aplicativo-publico.a"
                      href={app.termsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {t("servidor.descoberta.termos")}
                    </a>
                  )}
                  {app.policyUrl && (
                    <a data-gc="bot.aplicativo-publico.a--2"
                      href={app.policyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {t("servidor.descoberta.politica")}
                    </a>
                  )}
                </span>
              </Dado>
            )}

            <Dado data-gc="bot.aplicativo-publico.dado--7" title={t("servidor.descoberta.feitoPor")}>
              {app.owner.displayName}
            </Dado>

            <Dado data-gc="bot.aplicativo-publico.dado--8" title={t("servidor.descoberta.publicadoEm")}>
              {formatTimestamp(app.createdAt)}
            </Dado>
          </aside>
        </div>
      </div>

      <ReportModal data-gc="bot.aplicativo-publico.report-modal"
        botId={botId}
        name={app.name}
        isOpen={reporting}
        onClose={() => setReporting(false)}
      />
    </div>
  );
};

const Dado: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div data-gc="bot.aplicativo-publico.div--13">
    <p data-gc="bot.aplicativo-publico.p--6" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
      {icon} {title}
    </p>
    <p data-gc="bot.aplicativo-publico.p--7" className="mt-1 text-ink">{children}</p>
  </div>
);

const ReportModal: React.FC<{
  botId: string;
  name: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ botId, name, isOpen, onClose }) => {
  const { t } = useTranslation();
  const report = useReportApp(botId);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [details, setDetails] = useState("");

  const send = async () => {
    await report.mutateAsync({ reason, details: details.trim() || undefined }).catch(() => null);
    setDetails("");
    onClose();
  };

  return (
    <Dialog data-gc="bot.aplicativo-publico.dialog" open={isOpen} onOpenChange={(a) => !a && onClose()}>
      <DialogContent data-gc="bot.aplicativo-publico.dialog-content" className="max-w-md">
        <DialogHeader data-gc="bot.aplicativo-publico.dialog-header">
          <DialogTitle data-gc="bot.aplicativo-publico.dialog-title">
            {t("servidor.descoberta.denunciarNome", { nome: name })}
          </DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="bot.aplicativo-publico.dialog-body">
          <p data-gc="bot.aplicativo-publico.p--8" className="text-sm text-ink-muted">
            {t("servidor.descoberta.denunciaDetalhe")}
          </p>

          <Label data-gc="bot.aplicativo-publico.label" className="mt-4">{t("servidor.denuncia.motivo")}</Label>
          <SelectField data-gc="bot.aplicativo-publico.select-field.set-reason"
            value={reason}
            onSelect={setReason}
            options={REASONS.map((id) => ({
              value: id,
              label: t(`servidor.denuncia.motivos.${id}`),
            }))}
          />

          <Label data-gc="bot.aplicativo-publico.label--2" className="mt-4" htmlFor="denuncia-detalhes">
            {t("servidor.denuncia.detalhes")}
          </Label>
          <Input data-gc="bot.aplicativo-publico.input"
            id="denuncia-detalhes"
            value={details}
            maxLength={1000}
            onChange={(e) => setDetails(e.target.value)}
          />
        </DialogBody>

        <DialogFooter data-gc="bot.aplicativo-publico.dialog-footer">
          <Button data-gc="bot.aplicativo-publico.button.on-close" variant="ghost" onClick={onClose}>
            {t("comum.cancelar")}
          </Button>
          <Button data-gc="bot.aplicativo-publico.button--7" disabled={report.isPending} onClick={() => void send()}>
            {t("servidor.denuncia.enviar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
