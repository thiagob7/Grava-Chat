import React, { useMemo, useState } from "react";
import { Check, Megaphone, ShieldCheck, TrendingUp, Users, Wrench } from "lucide-react";
import { MEMBERS_FOR_COMMUNITY, type Channel } from "@gravae/shared";

import {
  useAdjustCommunity,
  useCommunity,
  useEnableCommunity,
} from "~/@core/application/queries/guild/use-comunidade";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/input";
import { LottieArt } from "~/components/LottieArt";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { formatShortDate } from "~/lib/format";
import { SelectField } from "~/components/ui/select";
import { LANGUAGES } from "~/traducao";
import { useTranslation } from "~/traducao";
import { cn } from "~/lib/utils";

const CREATE = "criar";

const loadCommunity = () =>
  import("~/assets/animations/speech-bubbles.json").then((mod) => mod.default);

export const CommunitySection: React.FC<{ guildId: string; channels: Channel[] }> = ({
  guildId,
  channels,
}) => {
  const { t } = useTranslation();
  const { data: state, isLoading } = useCommunity(guildId);
  const adjust = useAdjustCommunity(guildId);
  const [assistant, setAssistant] = useState(false);

  const fromText = useMemo(() => channels.filter((channel) => channel.type === "TEXT"), [channels]);

  if (isLoading || !state) {
    return <p data-gc="servidor.server-settings.comunidade-section.p" className="text-sm text-ink-faint">{t("comum.carregando")}</p>;
  }

  if (!state.community) {
    const progress = Math.min(
      100,
      Math.round((state.members / MEMBERS_FOR_COMMUNITY) * 100),
    );
    const ready = state.missing <= 0;

    return (
      <>
        <div data-gc="servidor.server-settings.comunidade-section.div" className="flex flex-col gap-5">
          <div data-gc="servidor.server-settings.comunidade-section.div--2" className="overflow-hidden rounded-xl border border-line bg-surface-2">
            <div data-gc="servidor.server-settings.comunidade-section.div--3" className="flex flex-col items-center px-6 pb-7 pt-8 text-center sm:px-10">
              <LottieArt data-gc="servidor.server-settings.comunidade-section.lottie-art"
                name="speech-bubbles"
                load={loadCommunity}
                label={t("servidor.comunidade.ilustracao")}
                className="size-28"
              />

              <h2 data-gc="servidor.server-settings.comunidade-section.h2" className="mt-3 max-w-md text-xl font-bold leading-tight">
                {t("servidor.comunidade.convite")}
              </h2>
              <p data-gc="servidor.server-settings.comunidade-section.p--2" className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                {t("servidor.comunidade.conviteDetalhe")}
              </p>

              <Button data-gc="servidor.server-settings.comunidade-section.button"
                size="lg"
                className="mt-6"
                disabled={!ready}
                onClick={() => setAssistant(true)}
              >
                {t("servidor.comunidade.habilitar")}
              </Button>
            </div>

            <div data-gc="servidor.server-settings.comunidade-section.div--4" className="border-t border-line bg-surface-1 px-6 py-4 sm:px-10">
              <div data-gc="servidor.server-settings.comunidade-section.div--5" className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p data-gc="servidor.server-settings.comunidade-section.p--3" className="flex items-center gap-2 text-sm font-semibold">
                  <Users data-gc="servidor.server-settings.comunidade-section.users"
                    size={16}
                    className={ready ? "text-online" : "text-ink-faint"}
                  />
                  {t("servidor.comunidade.contagem", {
                    membros: state.members,
                    minimo: MEMBERS_FOR_COMMUNITY,
                  })}
                </p>

                <p data-gc="servidor.server-settings.comunidade-section.p--4" className={cn(
                  "text-xs",
                  ready ? "font-medium text-online" : "text-ink-faint",
                )}>
                  {ready
                    ? t("servidor.comunidade.prontoParaAbrir")
                    : t("servidor.comunidade.faltam", { quantos: state.missing })}
                </p>
              </div>

              <div data-gc="servidor.server-settings.comunidade-section.div--6" className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-trilho">
                <div data-gc="servidor.server-settings.comunidade-section.div--7"
                  className={cn(
                    "h-full rounded-full transition-all duration-500 motion-reduce:transition-none",
                    ready ? "bg-online" : "bg-brand",
                  )}
                  style={{ width: `${Math.max(progress, 2)}%` }}
                />
              </div>
            </div>
          </div>

          <div data-gc="servidor.server-settings.comunidade-section.div--8" className="grid gap-3 sm:grid-cols-3">
            <Perk data-gc="servidor.server-settings.comunidade-section.perk"
              icon={TrendingUp}
              title={t("servidor.comunidade.vantagemCrescer")}
              detail={t("servidor.comunidade.vantagemCrescerDetalhe")}
            />
            <Perk data-gc="servidor.server-settings.comunidade-section.perk--2"
              icon={ShieldCheck}
              title={t("servidor.comunidade.vantagemModerar")}
              detail={t("servidor.comunidade.vantagemModerarDetalhe")}
            />
            <Perk data-gc="servidor.server-settings.comunidade-section.perk--3"
              icon={Megaphone}
              title={t("servidor.comunidade.vantagemAvisos")}
              detail={t("servidor.comunidade.vantagemAvisosDetalhe")}
            />
          </div>
        </div>

        <Assistant data-gc="servidor.server-settings.comunidade-section.assistant"
          guildId={guildId}
          channels={fromText}
          isOpen={assistant}
          onClose={() => setAssistant(false)}
        />
      </>
    );
  }

  const options = [
    { value: "", label: t("servidor.comunidade.semCanal") },
    ...fromText.map((channel) => ({ value: channel.id, label: `#${channel.name}` })),
  ];

  return (
    <div data-gc="servidor.server-settings.comunidade-section.div--9" className="flex flex-col gap-6">
      <div data-gc="servidor.server-settings.comunidade-section.div--10" className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 p-4">
        <span data-gc="servidor.server-settings.comunidade-section.span" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-online/10 text-online">
          <Check data-gc="servidor.server-settings.comunidade-section.check" size={18} />
        </span>

        <div data-gc="servidor.server-settings.comunidade-section.div--11" className="min-w-0 flex-1">
          <p data-gc="servidor.server-settings.comunidade-section.p--5" className="text-sm font-semibold">
            {t("servidor.comunidade.ativa")}
          </p>
          <p data-gc="servidor.server-settings.comunidade-section.p--6" className="mt-0.5 text-xs text-ink-faint">
            {state.communitySince
              ? t("servidor.comunidade.ativaDesde", {
                  quando: formatShortDate(state.communitySince),
                })
              : t("servidor.comunidade.membrosAgora", { quantos: state.members })}
          </p>
        </div>

        <span data-gc="servidor.server-settings.comunidade-section.span--2" className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-4 px-3 py-1 text-xs font-medium text-ink-muted">
          <Users data-gc="servidor.server-settings.comunidade-section.users--2" size={13} />
          {t("servidor.comunidade.membrosAgora", { quantos: state.members })}
        </span>
      </div>

      <Section data-gc="servidor.server-settings.comunidade-section.section"
        id="comunidade-visao-geral"
        title={t("servidor.comunidade.visaoGeral")}
        detail={t("servidor.comunidade.visaoGeralDetalhe")}
      >
        <Field data-gc="servidor.server-settings.comunidade-section.field"
          label={t("servidor.comunidade.canalDeRegras")}
          detail={t("servidor.comunidade.canalDeRegrasDetalhe")}
        >
          <SelectField data-gc="servidor.server-settings.comunidade-section.select-field"
            value={state.rulesChannelId ?? ""}
            onSelect={(id) => adjust.mutate({ rulesChannelId: id || null })}
            options={options}
          />
        </Field>

        <Field data-gc="servidor.server-settings.comunidade-section.field--2"
          label={t("servidor.comunidade.canalDeAvisos")}
          detail={t("servidor.comunidade.canalDeAvisosDetalhe")}
        >
          <SelectField data-gc="servidor.server-settings.comunidade-section.select-field--2"
            value={state.noticesChannelId ?? ""}
            onSelect={(id) => adjust.mutate({ noticesChannelId: id || null })}
            options={options}
          />
        </Field>

        <Field data-gc="servidor.server-settings.comunidade-section.field--3"
          label={t("servidor.comunidade.canalDeSeguranca")}
          detail={t("servidor.comunidade.canalDeSegurancaDetalhe")}
        >
          <SelectField data-gc="servidor.server-settings.comunidade-section.select-field--3"
            value={state.securityChannelId ?? ""}
            onSelect={(id) => adjust.mutate({ securityChannelId: id || null })}
            options={options}
          />
        </Field>

        <Field data-gc="servidor.server-settings.comunidade-section.field--4"
          label={t("servidor.comunidade.idiomaPrincipal")}
          detail={t("servidor.comunidade.idiomaPrincipalDetalhe")}
        >
          <SelectField data-gc="servidor.server-settings.comunidade-section.select-field--4"
            value={state.languagePrincipal ?? ""}
            onSelect={(lng) => adjust.mutate({ languagePrincipal: lng || null })}
            options={[
              { value: "", label: t("servidor.comunidade.semIdioma") },
              ...LANGUAGES.map((language) => ({
                value: language.lng,
                label: `${language.flag} ${language.native}`,
              })),
            ]}
          />
        </Field>
      </Section>

      <Section data-gc="servidor.server-settings.comunidade-section.section--2"
        id="comunidade-seguranca"
        title={t("servidor.comunidade.seguranca")}
        detail={t("servidor.comunidade.segurancaDetalhe")}
      >
        <Interruptor data-gc="servidor.server-settings.comunidade-section.interruptor"
          on={state.verifiedRequiresEmail}
          title={t("servidor.comunidade.emailVerificado")}
          detail={t("servidor.comunidade.emailVerificadoDetalhe")}
          onChange={(value) => adjust.mutate({ verifiedRequiresEmail: value })}
        />

        <Interruptor data-gc="servidor.server-settings.comunidade-section.interruptor--2"
          on={state.filtersMediaExplicit}
          title={t("servidor.comunidade.filtroDeMidia")}
          detail={t("servidor.comunidade.filtroDeMidiaDetalhe")}
          onChange={(value) => adjust.mutate({ filtersMediaExplicit: value })}
        />
      </Section>
    </div>
  );
};

const Perk: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  detail: string;
}> = ({ icon: Icon, title, detail }) => (
  <div data-gc="servidor.server-settings.comunidade-section.div--12" className="rounded-lg border border-line bg-surface-2 p-4">
    <span data-gc="servidor.server-settings.comunidade-section.span--3" className="flex size-8 items-center justify-center rounded-lg bg-surface-4 text-ink-muted">
      <Icon data-gc="servidor.server-settings.comunidade-section.icon" size={16} />
    </span>
    <p data-gc="servidor.server-settings.comunidade-section.p--7" className="mt-3 text-sm font-semibold">{title}</p>
    <p data-gc="servidor.server-settings.comunidade-section.p--8" className="mt-1 text-xs leading-relaxed text-ink-muted">
      {detail}
    </p>
  </div>
);

const Field: React.FC<{ label: string; detail: string; children: React.ReactNode }> = ({
  label,
  detail,
  children,
}) => (
  <div data-gc="servidor.server-settings.comunidade-section.div--13" className="flex flex-wrap items-start justify-between gap-3">
    <div data-gc="servidor.server-settings.comunidade-section.div--14" className="min-w-0 max-w-sm">
      <p data-gc="servidor.server-settings.comunidade-section.p--9" className="text-sm font-medium">{label}</p>
      <p data-gc="servidor.server-settings.comunidade-section.p--10" className="mt-0.5 text-xs leading-relaxed text-ink-muted">
        {detail}
      </p>
    </div>

    <div data-gc="servidor.server-settings.comunidade-section.div--15" className="w-full sm:w-64">{children}</div>
  </div>
);

const Interruptor: React.FC<{
  on: boolean;
  title: string;
  detail: string;
  onChange: (value: boolean) => void;
}> = ({ on, title, detail, onChange }) => (
  <label data-gc="servidor.server-settings.comunidade-section.label" className="flex cursor-pointer items-start gap-3">
    <Checkbox data-gc="servidor.server-settings.comunidade-section.checkbox"
      checked={on}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5"
    />

    <span data-gc="servidor.server-settings.comunidade-section.span--4" className="min-w-0">
      <span data-gc="servidor.server-settings.comunidade-section.span--5" className="block text-sm font-medium">{title}</span>
      <span data-gc="servidor.server-settings.comunidade-section.span--6" className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
        {detail}
      </span>
    </span>
  </label>
);

const Assistant: React.FC<{
  guildId: string;
  channels: Channel[];
  isOpen: boolean;
  onClose: () => void;
}> = ({ guildId, channels, isOpen, onClose }) => {
  const { t } = useTranslation();
  const enable = useEnableCommunity(guildId);

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState(true);
  const [media, setMedia] = useState(true);
  const [rules, setRules] = useState(CREATE);
  const [notices, setNotices] = useState(CREATE);
  const [language, setLanguage] = useState("");
  const [agree, setAgree] = useState(false);

  const steps = [
    t("servidor.comunidade.passoSeguranca"),
    t("servidor.comunidade.passoBasico"),
    t("servidor.comunidade.passoFinal"),
  ];

  const channelOptions = [
    { value: CREATE, label: t("servidor.comunidade.criarParaMim") },
    ...channels.map((channel) => ({ value: channel.id, label: `#${channel.name}` })),
  ];

  const finish = async () => {
    await enable
      .mutateAsync({
        verifiedRequiresEmail: email,
        filtersMediaExplicit: media,
        rulesChannelId: rules === CREATE ? null : rules,
        noticesChannelId: notices === CREATE ? null : notices,
        languagePrincipal: language || null,
      })
      .catch(() => null);

    onClose();
    setStep(0);
  };

  return (
    <Dialog data-gc="servidor.server-settings.comunidade-section.dialog" open={isOpen} onOpenChange={(a) => !a && onClose()}>
      <DialogContent data-gc="servidor.server-settings.comunidade-section.dialog-content" className="max-w-2xl gap-0 p-0 sm:flex-row">
        <aside data-gc="servidor.server-settings.comunidade-section.aside" className="shrink-0 bg-brand p-6 text-sobre-marca sm:w-56">
          <h2 data-gc="servidor.server-settings.comunidade-section.h2--2" className="text-xl font-bold leading-tight">
            {t("servidor.comunidade.assistenteTitulo")}
          </h2>

          <ol data-gc="servidor.server-settings.comunidade-section.ol" className="mt-8 flex flex-col gap-3 text-sm">
            {steps.map((name, i) => (
              <li data-gc="servidor.server-settings.comunidade-section.li" key={name} className="flex items-center gap-2.5">
                <span data-gc="servidor.server-settings.comunidade-section.span--7"
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    i <= step ? "border-sobre-marca bg-sobre-marca text-brand" : "border-sobre-marca/50",
                  )}
                >
                  {i < step ? <Check data-gc="servidor.server-settings.comunidade-section.check--2" size={13} /> : i + 1}
                </span>

                <span data-gc="servidor.server-settings.comunidade-section.span--8" className={cn(i === step ? "font-semibold" : "opacity-80")}>
                  {name}
                </span>
              </li>
            ))}
          </ol>
        </aside>

        <div data-gc="servidor.server-settings.comunidade-section.div--16" className="flex min-w-0 flex-1 flex-col">
          <DialogHeader data-gc="servidor.server-settings.comunidade-section.dialog-header" className="items-center text-center">
            <span data-gc="servidor.server-settings.comunidade-section.span--9" className="mx-auto flex size-12 items-center justify-center rounded-xl bg-surface-3 text-ink">
              {step === 0 ? (
                <ShieldCheck data-gc="servidor.server-settings.comunidade-section.shield-check" size={22} />
              ) : step === 1 ? (
                <Wrench data-gc="servidor.server-settings.comunidade-section.wrench" size={22} />
              ) : (
                <Check data-gc="servidor.server-settings.comunidade-section.check--3" size={22} />
              )}
            </span>

            <DialogTitle data-gc="servidor.server-settings.comunidade-section.dialog-title" className="mt-3">
              {step === 0
                ? t("servidor.comunidade.seguraTitulo")
                : step === 1
                  ? t("servidor.comunidade.basicoTitulo")
                  : t("servidor.comunidade.finalTitulo")}
            </DialogTitle>
          </DialogHeader>

          <DialogBody data-gc="servidor.server-settings.comunidade-section.dialog-body" className="space-y-5">
            {step === 0 && (
              <>
                <p data-gc="servidor.server-settings.comunidade-section.p--11" className="text-sm leading-relaxed text-ink-muted">
                  {t("servidor.comunidade.seguraDetalhe")}
                </p>

                <Interruptor data-gc="servidor.server-settings.comunidade-section.interruptor.set-email"
                  on={email}
                  onChange={setEmail}
                  title={t("servidor.comunidade.emailVerificado")}
                  detail={t("servidor.comunidade.emailVerificadoDetalhe")}
                />

                <Interruptor data-gc="servidor.server-settings.comunidade-section.interruptor.set-media"
                  on={media}
                  onChange={setMedia}
                  title={t("servidor.comunidade.filtroDeMidia")}
                  detail={t("servidor.comunidade.filtroDeMidiaDetalhe")}
                />
              </>
            )}

            {step === 1 && (
              <>
                <p data-gc="servidor.server-settings.comunidade-section.p--12" className="text-sm leading-relaxed text-ink-muted">
                  {t("servidor.comunidade.basicoDetalhe")}
                </p>

                <div data-gc="servidor.server-settings.comunidade-section.div--17">
                  <Label data-gc="servidor.server-settings.comunidade-section.label--2">{t("servidor.comunidade.canalDeRegras")}</Label>
                  <p data-gc="servidor.server-settings.comunidade-section.p--13" className="mb-2 text-xs text-ink-muted">
                    {t("servidor.comunidade.canalDeRegrasDetalhe")}
                  </p>
                  <SelectField data-gc="servidor.server-settings.comunidade-section.select-field.set-rules"
                    value={rules}
                    onSelect={setRules}
                    options={channelOptions}
                  />
                </div>

                <div data-gc="servidor.server-settings.comunidade-section.div--18">
                  <Label data-gc="servidor.server-settings.comunidade-section.label--3">{t("servidor.comunidade.canalDeAvisos")}</Label>
                  <p data-gc="servidor.server-settings.comunidade-section.p--14" className="mb-2 text-xs text-ink-muted">
                    {t("servidor.comunidade.canalDeAvisosDetalhe")}
                  </p>
                  <SelectField data-gc="servidor.server-settings.comunidade-section.select-field.set-notices"
                    value={notices}
                    onSelect={setNotices}
                    options={channelOptions}
                  />
                </div>

                <div data-gc="servidor.server-settings.comunidade-section.div--19">
                  <Label data-gc="servidor.server-settings.comunidade-section.label--4">{t("servidor.comunidade.idiomaPrincipal")}</Label>
                  <SelectField data-gc="servidor.server-settings.comunidade-section.select-field.set-language"
                    value={language}
                    onSelect={setLanguage}
                    options={[
                      { value: "", label: t("servidor.comunidade.semIdioma") },
                      ...LANGUAGES.map((item) => ({
                        value: item.lng,
                        label: `${item.flag} ${item.native}`,
                      })),
                    ]}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p data-gc="servidor.server-settings.comunidade-section.p--15" className="text-sm leading-relaxed text-ink-muted">
                  {t("servidor.comunidade.finalDetalhe")}
                </p>

                <ul data-gc="servidor.server-settings.comunidade-section.ul" className="space-y-2 rounded-lg border border-line bg-surface-1 p-4 text-sm">
                  <Checks data-gc="servidor.server-settings.comunidade-section.checks" text={t("servidor.comunidade.confereMencoes")} />
                  <Checks data-gc="servidor.server-settings.comunidade-section.checks--2" text={t("servidor.comunidade.confereEveryone")} />
                  <Checks data-gc="servidor.server-settings.comunidade-section.checks--3" text={t("servidor.comunidade.confereRegras")} />
                </ul>

                <Interruptor data-gc="servidor.server-settings.comunidade-section.interruptor.set-agree"
                  on={agree}
                  onChange={setAgree}
                  title={t("servidor.comunidade.concordo")}
                  detail={t("servidor.comunidade.concordoDetalhe")}
                />
              </>
            )}
          </DialogBody>

          <DialogFooter data-gc="servidor.server-settings.comunidade-section.dialog-footer">
            {step > 0 && (
              <Button data-gc="servidor.server-settings.comunidade-section.button--2" variant="ghost" onClick={() => setStep((p) => p - 1)}>
                {t("comum.voltar")}
              </Button>
            )}

            {step < 2 ? (
              <Button data-gc="servidor.server-settings.comunidade-section.button--3" onClick={() => setStep((p) => p + 1)}>
                {t("servidor.comunidade.proximo")}
              </Button>
            ) : (
              <Button data-gc="servidor.server-settings.comunidade-section.button--4"
                disabled={!agree || enable.isPending}
                onClick={() => void finish()}
              >
                {t("servidor.comunidade.terminar")}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Checks: React.FC<{ text: string }> = ({ text }) => (
  <li data-gc="servidor.server-settings.comunidade-section.li--2" className="flex items-start gap-2 text-ink-muted">
    <Check data-gc="servidor.server-settings.comunidade-section.check--4" size={14} className="mt-0.5 shrink-0 text-online" />
    {text}
  </li>
);
