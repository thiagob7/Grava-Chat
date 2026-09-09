import React, { useState } from "react";
import { CalendarBlank, MapPin, SpeakerHigh, Users, X } from "@phosphor-icons/react";

import { LottieArt } from "~/components/LottieArt";
import type { GuildEvent } from "@gravae/shared";

import {
  useCancelEvent,
  useEvents,
  useSetEventInterest,
} from "~/@core/application/queries/guild/use-events";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { useConfirm } from "~/components/ui/confirm";
import { CreateEventForm } from "~/features/servidor/components/CreateEventForm";
import { formatEventDate } from "~/features/servidor/lib/event-timing";
import { Avatar } from "~/features/perfil/components/Avatar";
import { cn } from "~/lib/utils";

export const EventsModal: React.FC<{
  guildId: string;
  open: boolean;
  canCreate: boolean;
  onClose: () => void;
}> = ({ guildId, open, canCreate, onClose }) => {
  const [creating, setCreating] = useState(false);
  const { data: events, isPending } = useEvents(guildId, open);

  const leaveCreation = () => setCreating(false);

  const close = () => {
    setCreating(false);
    onClose();
  };

  return (
    <Dialog data-gc="servidor.events-modal.dialog" open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent data-gc="servidor.events-modal.dialog-content"
        showClose={false}
        className={creating ? "max-w-lg" : "max-w-2xl p-0"}
      >
        {creating ? (
          <>
            <DialogTitle data-gc="servidor.events-modal.dialog-title" className="sr-only">Criar evento</DialogTitle>
            <CreateEventForm data-gc="servidor.events-modal.create-event-form.leave-creation" guildId={guildId} onDone={leaveCreation} />
          </>
        ) : (
          <>
            <header data-gc="servidor.events-modal.header" className="flex items-center gap-3 border-b border-divisor px-5 py-4">
              <CalendarBlank data-gc="servidor.events-modal.calendar-blank" size={20} weight="fill" className="shrink-0 text-ink-muted" />
              <DialogTitle data-gc="servidor.events-modal.dialog-title--2" className="text-base font-semibold">Eventos</DialogTitle>

              {canCreate && (
                <Button data-gc="servidor.events-modal.button" size="sm" className="ml-auto" onClick={() => setCreating(true)}>
                  Criar evento
                </Button>
              )}

              <button data-gc="servidor.events-modal.button.close"
                type="button"
                onClick={close}
                aria-label="Fechar"
                className={cn(
                  "shrink-0 rounded p-1 text-ink-faint transition hover:bg-hover hover:text-ink",
                  !canCreate && "ml-auto",
                )}
              >
                <X data-gc="servidor.events-modal.x" size={20} />
              </button>
            </header>

            <div data-gc="servidor.events-modal.div" className="max-h-[60vh] min-h-[18rem] overflow-y-auto p-5">
              {isPending ? (
                <div data-gc="servidor.events-modal.div--2" className="space-y-3">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton data-gc="servidor.events-modal.skeleton" key={index} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : !events?.length ? (
                <EmptyState data-gc="servidor.events-modal.empty-state" canCreate={canCreate} />
              ) : (
                <div data-gc="servidor.events-modal.div--3" className="space-y-3">
                  {events.map((event) => (
                    <EventCard data-gc="servidor.events-modal.event-card"
                      key={event.id}
                      guildId={guildId}
                      event={event}
                      canManage={canCreate}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const loadCalendar = () =>
  import("~/assets/animations/marking-a-calendar.json").then((mod) => mod.default);

const EmptyState: React.FC<{ canCreate: boolean }> = ({ canCreate }) => (
  <div data-gc="servidor.events-modal.div--4" className="flex flex-col items-center justify-center gap-4 py-10 text-center">
    <div data-gc="servidor.events-modal.div--5" className="rounded-2xl bg-[#ebf3fa] px-6 py-2">
      <LottieArt data-gc="servidor.events-modal.lottie-art"
        name="marking-a-calendar"
        load={loadCalendar}
        label="Alguém marcando uma data num calendário grande"
        className="h-40 w-64"
      />
    </div>

    <div data-gc="servidor.events-modal.div--6">
      <p data-gc="servidor.events-modal.p" className="text-lg font-semibold">Não há eventos futuros.</p>
      <p data-gc="servidor.events-modal.p--2" className="mt-1 max-w-sm text-sm text-ink-muted">
        {canCreate
          ? "Marque um evento para qualquer coisa planejada no seu servidor."
          : "Quando alguém marcar algo por aqui, aparece nesta lista."}
      </p>
    </div>
  </div>
);

const EventCard: React.FC<{ guildId: string; event: GuildEvent; canManage: boolean }> = ({
  guildId,
  event,
  canManage,
}) => {
  const interest = useSetEventInterest(guildId);
  const cancel = useCancelEvent(guildId);
  const confirm = useConfirm();

  const remove = async () => {
    const { confirmed } = await confirm({
      title: `Cancelar ${event.name}?`,
      description: "Ele sai da lista para todo mundo. Não dá para desfazer.",
      action: "Cancelar o evento",
      destructive: true,
    });

    if (confirmed) cancel.mutate(event.id);
  };

  return (
    <article data-gc="servidor.events-modal.article" className="overflow-hidden rounded-lg bg-surface-2">
      {event.imageUrl && (
        <img data-gc="servidor.events-modal.img" src={event.imageUrl} alt="" className="h-32 w-full object-cover" />
      )}

      <div data-gc="servidor.events-modal.div--7" className="p-4">
        <header data-gc="servidor.events-modal.header--2" className="flex items-center gap-2">
          <CalendarBlank data-gc="servidor.events-modal.calendar-blank--2" size={14} weight="fill" className="shrink-0 text-brand" />
          <span data-gc="servidor.events-modal.span" className="text-xs font-semibold text-brand">{formatEventDate(event.startsAt)}</span>

          <span data-gc="servidor.events-modal.span--2" className="ml-auto flex items-center gap-2">
            {event.author && (
              <Avatar data-gc="servidor.events-modal.avatar"
                id={event.author.id}
                name={event.author.displayName}
                url={event.author.avatarUrl}
                size={20}
              />
            )}
            <span data-gc="servidor.events-modal.span--3" className="flex items-center gap-1 rounded-full bg-surface-3 px-2 py-0.5 text-xs text-ink-muted">
              <Users data-gc="servidor.events-modal.users" size={12} weight="fill" /> {event.interestedCount}
            </span>
          </span>
        </header>

        <h3 data-gc="servidor.events-modal.h3" className="mt-1 text-base font-semibold">{event.name}</h3>

        {event.description && (
          <p data-gc="servidor.events-modal.p--3" className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">{event.description}</p>
        )}

        <p data-gc="servidor.events-modal.p--4" className="mt-3 flex items-center gap-1.5 text-sm text-ink-muted">
          {event.channelId ? (
            <>
              <SpeakerHigh data-gc="servidor.events-modal.speaker-high" size={14} weight="fill" className="shrink-0" />
              {event.channelName ?? "canal removido"}
            </>
          ) : (
            <>
              <MapPin data-gc="servidor.events-modal.map-pin" size={14} weight="fill" className="shrink-0" />
              {event.externalLocation}
            </>
          )}
        </p>

        <footer data-gc="servidor.events-modal.footer" className="mt-4 flex items-center gap-2">
          <Button data-gc="servidor.events-modal.button--2"
            size="sm"
            variant={event.isInterested ? "surface" : "primary"}
            disabled={interest.isPending}
            onClick={() =>
              interest.mutate({ eventId: event.id, interested: !event.isInterested })
            }
          >
            {event.isInterested ? "Tenho interesse ✓" : "Tenho interesse"}
          </Button>

          {canManage && (
            <Button data-gc="servidor.events-modal.button--3"
              size="sm"
              variant="ghost"
              className={cn("ml-auto text-danger")}
              disabled={cancel.isPending}
              onClick={() => void remove()}
            >
              Cancelar
            </Button>
          )}
        </footer>
      </div>
    </article>
  );
};
