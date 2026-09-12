import React, { useMemo, useRef, useState } from "react";
import { CalendarBlank, Check, Copy, ImageSquare, MapPin, SpeakerHigh, X } from "@phosphor-icons/react";
import {
  EVENT_FREQUENCIES,
  EVENT_FREQUENCY_LABELS,
  EVENT_LIMITS,
  type EventFrequency,
  type GuildEvent,
} from "@gravae/shared";

import { useCreateEvent } from "~/@core/application/queries/guild/use-events";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { Button } from "~/components/ui/button";
import { DialogBody, DialogFooter } from "~/components/ui/dialog";
import { Input, Label, Textarea } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";
import { formatEventDate } from "~/features/servidor/lib/event-timing";
import { ImageEditor } from "~/components/EditorDeImagem";
import { Confetti } from "~/components/Confete";
import { copyText } from "~/lib/copiar";
import { cn } from "~/lib/utils";

const COVER_MAX_PX = 1024;
const COVER_ASPECT = 16 / 9;

type Step = "place" | "details" | "review" | "done";
type Place = "channel" | "outside";

const STEPS: { id: Step; label: string }[] = [
  { id: "place", label: "Localização" },
  { id: "details", label: "Informações do evento" },
  { id: "review", label: "Revisar" },
];

const nextFullHour = () => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
};

const toInputValue = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const CreateEventForm: React.FC<{
  guildId: string;
  onDone: () => void;
}> = ({ guildId, onDone }) => {
  const create = useCreateEvent(guildId);
  const { data: guild } = useFindGuild(guildId);

  const [step, setStep] = useState<Step>("place");
  const [place, setPlace] = useState<Place>("channel");
  const [channelId, setChannelId] = useState("");
  const [externalLocation, setExternalLocation] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(() => toInputValue(nextFullHour()));
  const [frequency, setFrequency] = useState<EventFrequency>("once");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState<File | null>(null);
  const [created, setCreated] = useState<GuildEvent | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadImage();

  /*
    A imagem escolhida não sobe direto: primeiro a pessoa enquadra. Só o
    recorte vai para o servidor, então a capa sai do jeito que ela viu.
  */
  const pickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) setEditing(file);
  };

  const sendCut = async (cut: File) => {
    setEditing(null);

    const uploaded = await uploadImage
      .mutateAsync({ file: cut, maxSize: COVER_MAX_PX })
      .catch(() => null);

    if (uploaded) setImageUrl(uploaded.attachment.url);
  };

  const voiceChannels = useMemo(
    () => (guild?.channels ?? []).filter((channel) => channel.type === "VOICE"),
    [guild],
  );

  const placeReady = place === "channel" ? Boolean(channelId) : Boolean(externalLocation.trim());
  const detailsReady = Boolean(name.trim()) && Boolean(startsAt);

  const reset = () => {
    setStep("place");
    setPlace("channel");
    setChannelId("");
    setExternalLocation("");
    setName("");
    setDescription("");
    setStartsAt(toInputValue(nextFullHour()));
    setFrequency("once");
    setImageUrl(null);
  };

  const leave = () => {
    reset();
    onDone();
  };

  const submit = () =>
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        startsAt: new Date(startsAt).toISOString(),
        frequency,
        imageUrl,
        channelId: place === "channel" ? channelId : null,
        externalLocation: place === "outside" ? externalLocation.trim() : null,
      },
      {
        onSuccess: (event) => {
          setCreated(event);
          setStep("done");
        },
      },
    );

  return (
    <>
      <ImageEditor data-gc="servidor.create-event-form.image-editor"
        file={editing}
        aspect={COVER_ASPECT}
        exportWidth={COVER_MAX_PX}
        onCancel={() => setEditing(null)}
        onApply={(cut) => void sendCut(cut)}
      />

      <div data-gc="servidor.create-event-form.div" className="flex gap-2 px-5 pt-4">
        {STEPS.map((entry) => {
          const index = STEPS.findIndex((item) => item.id === entry.id);
          const current = step === "done" ? STEPS.length : STEPS.findIndex((item) => item.id === step);

          return (
            <div data-gc="servidor.create-event-form.div--2" key={entry.id} className="flex-1">
              <span data-gc="servidor.create-event-form.span"
                className={cn(
                  "block h-1 rounded-full transition",
                  index <= current ? "bg-brand" : "bg-line",
                )}
              />
              <span data-gc="servidor.create-event-form.span--2"
                className={cn(
                  "mt-2 block truncate text-12 leading-4",
                  index === current ? "text-brand" : "text-ink-muted",
                )}
              >
                {entry.label}
              </span>
            </div>
          );
        })}
      </div>

      <DialogBody data-gc="servidor.create-event-form.dialog-body" className="space-y-4">
        {step === "place" && (
          <>
            <div data-gc="servidor.create-event-form.div--3">
              <h2 data-gc="servidor.create-event-form.h2" className="text-lg font-semibold">Onde é seu evento?</h2>
              <p data-gc="servidor.create-event-form.p" className="text-sm text-ink-muted">
                Para ninguém ficar perdido e saber aonde ir.
              </p>
            </div>

            <Choice data-gc="servidor.create-event-form.choice"
              checked={place === "channel"}
              onChoose={() => setPlace("channel")}
              icon={<SpeakerHigh data-gc="servidor.create-event-form.speaker-high" size={16} weight="fill" />}
              title="Canal de voz"
              detail="Encontrem-se com voz, vídeo e compartilhamento de tela."
            />

            {place === "channel" && (
              <div data-gc="servidor.create-event-form.div--4" className="pl-[2.375rem]">
                <Label data-gc="servidor.create-event-form.label" htmlFor="event-channel">Selecione um canal</Label>
                {voiceChannels.length ? (
                  <SelectField data-gc="servidor.create-event-form.select-field.set-channel-id"
                    id="event-channel"
                    placeholder="Escolha o canal de voz"
                    value={channelId}
                    onSelect={setChannelId}
                    options={voiceChannels.map((channel) => ({
                      value: channel.id,
                      label: channel.name,
                    }))}
                  />
                ) : (
                  <p data-gc="servidor.create-event-form.p--2" className="text-sm text-ink-faint">
                    Este servidor ainda não tem canal de voz.
                  </p>
                )}
              </div>
            )}

            <Choice data-gc="servidor.create-event-form.choice--2"
              checked={place === "outside"}
              onChoose={() => setPlace("outside")}
              icon={<MapPin data-gc="servidor.create-event-form.map-pin" size={16} weight="fill" />}
              title="Em outro lugar"
              detail="Canal de texto, link externo, ou lugar de verdade."
            />

            {place === "outside" && (
              <div data-gc="servidor.create-event-form.div--5" className="pl-[2.375rem]">
                <Label data-gc="servidor.create-event-form.label--2" htmlFor="event-location">Insira uma localização</Label>
                <Input data-gc="servidor.create-event-form.input"
                  id="event-location"
                  value={externalLocation}
                  maxLength={EVENT_LIMITS.location}
                  placeholder="Um endereço, um link, ou algo assim"
                  onChange={(event) => setExternalLocation(event.target.value)}
                />
              </div>
            )}
          </>
        )}

        {step === "details" && (
          <>
            <div data-gc="servidor.create-event-form.div--6">
              <h2 data-gc="servidor.create-event-form.h2--2" className="text-lg font-semibold">Sobre o que é o seu evento?</h2>
              <p data-gc="servidor.create-event-form.p--3" className="text-sm text-ink-muted">Preencha os detalhes.</p>
            </div>

            <div data-gc="servidor.create-event-form.div--7">
              <Label data-gc="servidor.create-event-form.label--3" htmlFor="event-name">Assunto do evento *</Label>
              <Input data-gc="servidor.create-event-form.input--2"
                id="event-name"
                autoFocus
                value={name}
                maxLength={EVENT_LIMITS.name}
                placeholder="Sobre o que é o seu evento?"
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div data-gc="servidor.create-event-form.div--8" className="flex gap-3">
              <div data-gc="servidor.create-event-form.div--9" className="flex-1">
                <Label data-gc="servidor.create-event-form.label--4" htmlFor="event-starts-at">Começa em *</Label>
                <Input data-gc="servidor.create-event-form.input--3"
                  id="event-starts-at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                />
              </div>

              <div data-gc="servidor.create-event-form.div--10" className="flex-1">
                <Label data-gc="servidor.create-event-form.label--5" htmlFor="event-frequency">Frequência *</Label>
                <SelectField data-gc="servidor.create-event-form.select-field"
                  id="event-frequency"
                  value={frequency}
                  onSelect={(value) => setFrequency(value as EventFrequency)}
                  options={EVENT_FREQUENCIES.map((entry) => ({
                    value: entry,
                    label: EVENT_FREQUENCY_LABELS[entry],
                  }))}
                />
              </div>
            </div>

            <div data-gc="servidor.create-event-form.div--11">
              <Label data-gc="servidor.create-event-form.label--6" htmlFor="event-description">Descrição</Label>
              <Textarea data-gc="servidor.create-event-form.textarea"
                id="event-description"
                rows={4}
                value={description}
                maxLength={EVENT_LIMITS.description}
                placeholder="Conte às pessoas um pouco mais sobre o seu evento."
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div data-gc="servidor.create-event-form.div--12">
              <Label data-gc="servidor.create-event-form.label--7" htmlFor="event-cover">Imagem de capa</Label>

              <input data-gc="servidor.create-event-form.input--4"
                ref={imageInput}
                id="event-cover"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void pickImage(event)}
              />

              {imageUrl ? (
                <div data-gc="servidor.create-event-form.div--13" className="relative overflow-hidden rounded-lg">
                  <img data-gc="servidor.create-event-form.img" src={imageUrl} alt="" className="h-32 w-full object-cover" />
                  <button data-gc="servidor.create-event-form.button"
                    type="button"
                    aria-label="Remover a imagem"
                    onClick={() => setImageUrl(null)}
                    className="absolute right-2 top-2 rounded-full bg-surface-1/80 p-1 text-ink transition hover:bg-surface-1"
                  >
                    <X data-gc="servidor.create-event-form.x" size={14} weight="bold" />
                  </button>
                </div>
              ) : (
                <button data-gc="servidor.create-event-form.button--2"
                  type="button"
                  disabled={uploadImage.isPending}
                  onClick={() => imageInput.current?.click()}
                  className="flex h-20 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line text-sm text-ink-muted transition hover:border-brand hover:text-ink disabled:opacity-60"
                >
                  <ImageSquare data-gc="servidor.create-event-form.image-square" size={18} weight="fill" />
                  {uploadImage.isPending ? "Enviando…" : "Escolher uma imagem"}
                </button>
              )}
            </div>
          </>
        )}

        {step === "review" && (
          <>
            <article data-gc="servidor.create-event-form.article" className="overflow-hidden rounded-lg bg-surface-2">
              {imageUrl && <img data-gc="servidor.create-event-form.img--2" src={imageUrl} alt="" className="h-32 w-full object-cover" />}

              <div data-gc="servidor.create-event-form.div--14" className="p-4">
                <p data-gc="servidor.create-event-form.p--4" className="text-xs font-semibold text-brand">
                  {formatEventDate(new Date(startsAt).toISOString())}
                </p>
                <h3 data-gc="servidor.create-event-form.h3" className="mt-1 text-base font-semibold">{name}</h3>
                {description && (
                  <p data-gc="servidor.create-event-form.p--5" className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">{description}</p>
                )}
              </div>

              <p data-gc="servidor.create-event-form.p--6" className="flex items-center gap-1.5 border-t border-divisor px-4 py-2.5 text-sm text-ink-muted">
                {place === "channel" ? (
                  <>
                    <SpeakerHigh data-gc="servidor.create-event-form.speaker-high--2" size={14} weight="fill" />
                    {voiceChannels.find((channel) => channel.id === channelId)?.name ?? "—"}
                  </>
                ) : (
                  <>
                    <MapPin data-gc="servidor.create-event-form.map-pin--2" size={14} weight="fill" />
                    {externalLocation}
                  </>
                )}
              </p>
            </article>

            <div data-gc="servidor.create-event-form.div--15" className="text-center">
              <p data-gc="servidor.create-event-form.p--7" className="font-semibold">Aqui está uma prévia do seu evento.</p>
              <p data-gc="servidor.create-event-form.p--8" className="mt-0.5 text-sm text-ink-muted">
                {frequency === "once"
                  ? "Ele acontece uma vez, na hora marcada."
                  : `Depois disso, ${EVENT_FREQUENCY_LABELS[frequency].toLowerCase()}.`}
              </p>
            </div>
          </>
        )}

        {step === "done" && created && (
          <div data-gc="servidor.create-event-form.div--16" className="py-2 text-center">
            <span data-gc="servidor.create-event-form.span--3"
              className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-3 text-ink"
            >
              <CalendarBlank data-gc="servidor.create-event-form.calendar-blank" size={26} weight="fill" />
            </span>

            <p data-gc="servidor.create-event-form.p--9" className="mt-4 text-lg font-semibold">
              Tudo pronto. Agora compartilhe seu evento!
            </p>
            <p data-gc="servidor.create-event-form.p--10" className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
              Copie o endereço abaixo para chamar gente. Ele abre o servidor já
              com o evento na frente.
            </p>

            <EventLink data-gc="servidor.create-event-form.event-link" guildId={guildId} eventId={created.id} />
          </div>
        )}
      </DialogBody>

      <DialogFooter data-gc="servidor.create-event-form.dialog-footer">
        {step === "done" ? (
          <Button data-gc="servidor.create-event-form.button.leave" className="ml-auto" onClick={leave}>
            Concluir
          </Button>
        ) : (
        <>
        {step !== "place" && (
          <Button data-gc="servidor.create-event-form.button--3"
            variant="ghost"
            className="mr-auto"
            onClick={() => setStep(step === "review" ? "details" : "place")}
          >
            Voltar
          </Button>
        )}

        <Button data-gc="servidor.create-event-form.button.leave--2" variant="surface" onClick={leave}>
          Cancelar
        </Button>

        {step === "review" ? (
          <Button data-gc="servidor.create-event-form.button.submit" disabled={create.isPending} onClick={submit}>
            {create.isPending ? "Criando…" : "Criar evento"}
          </Button>
        ) : (
          <Button data-gc="servidor.create-event-form.button--4"
            disabled={step === "place" ? !placeReady : !detailsReady}
            onClick={() => setStep(step === "place" ? "details" : "review")}
          >
            Próximo
          </Button>
        )}
        </>
        )}
    </DialogFooter>

      <Confetti data-gc="servidor.create-event-form.confetti" playing={step === "done"} />
    </>
  );
};

const Choice: React.FC<{
  checked: boolean;
  onChoose: () => void;
  icon: React.ReactNode;
  title: string;
  detail: string;
}> = ({ checked, onChoose, icon, title, detail }) => (
  <button data-gc="servidor.create-event-form.button.on-choose"
    type="button"
    onClick={onChoose}
    className={cn(
      "flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition",
      checked ? "bg-surface-2" : "hover:bg-hover",
    )}
  >
    <span data-gc="servidor.create-event-form.span--4"
      className={cn(
        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition",
        checked ? "border-brand" : "border-line",
      )}
    >
      {checked && <span data-gc="servidor.create-event-form.span--5" className="size-2 rounded-full bg-brand" />}
    </span>

    <span data-gc="servidor.create-event-form.span--6" className="min-w-0">
      <span data-gc="servidor.create-event-form.span--7" className="flex items-center gap-1.5 text-sm font-medium leading-5">
        {icon}
        {title}
      </span>
      <span data-gc="servidor.create-event-form.span--8" className="mt-0.5 block text-13 leading-[18px] text-ink-muted">{detail}</span>
    </span>
  </button>
);

/*
  O endereço tem o servidor e o evento. Quem já pode ver o servidor cai direto
  nele, com o evento aberto; quem não pode continua precisando de um convite,
  como em qualquer outro canto.
*/
const EventLink: React.FC<{ guildId: string; eventId: string }> = ({ guildId, eventId }) => {
  const [copied, setCopied] = useState(false);
  const clock = useRef<ReturnType<typeof setTimeout>>(undefined);

  const link = `${window.location.origin}/evento/${guildId}/${eventId}`;

  const copy = async () => {
    if (!(await copyText(link))) return;

    setCopied(true);
    clearTimeout(clock.current);
    clock.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div data-gc="servidor.create-event-form.div--17" className="mt-5 flex items-center gap-2">
      <Input data-gc="servidor.create-event-form.input--5" readOnly value={link} className="min-w-0 flex-1" />

      <Button data-gc="servidor.create-event-form.button--5" onClick={() => void copy()} className="shrink-0">
        {copied ? (
          <>
            <Check data-gc="servidor.create-event-form.check" size={16} /> Copiado
          </>
        ) : (
          <>
            <Copy data-gc="servidor.create-event-form.copy" size={16} /> Copiar
          </>
        )}
      </Button>
    </div>
  );
};
