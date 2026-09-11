import React, { useRef, useState } from "react";
import { ArrowCounterClockwise, Check, SquaresFour, UploadSimple } from "@phosphor-icons/react";
import { toast } from "react-toastify";

import { Button } from "~/components/ui/button";
import {
  CursorRefused,
  CURSOR_LIMITS,
  ROLES_NAMES,
  CURSOR_ROLES,
  RESERVE,
  asRule,
  readCursor,
  dotAllowed,
  type CursorRole,
} from "~/features/configuracoes/lib/cursor-importado";
import { CURSOR_PACKETS, type CursorPacket } from "~/features/configuracoes/lib/pacotes-de-cursor";
import { CURSORS_LIBRARY } from "~/features/configuracoes/lib/biblioteca-de-cursores";
import { PickLibrary } from "~/features/configuracoes/components/EscolherDaBiblioteca";
import { useCursors } from "~/features/configuracoes/stores/cursores";
import { cn } from "~/lib/utils";

export const CursorsSection: React.FC = () => {
  const cursors = useCursors((s) => s.cursors);
  const set = useCursors((s) => s.set);
  const clear = useCursors((s) => s.clear);

  const [inLibrary, setLibrary] = useState<CursorRole | null>(null);

  const picked = CURSOR_ROLES.filter((role) => cursors[role]).length;

  return (
    <div data-gc="configuracoes.cursores-section.div" className="mx-auto flex max-w-3xl flex-col gap-8">
      <header data-gc="configuracoes.cursores-section.header" className="flex flex-wrap items-start justify-between gap-3">
        <div data-gc="configuracoes.cursores-section.div--2" className="min-w-0">
          <h2 data-gc="configuracoes.cursores-section.h2" className="text-lg font-semibold">Cursores</h2>
          <p data-gc="configuracoes.cursores-section.p" className="mt-1 max-w-lg text-sm leading-relaxed text-ink-muted">
            Escolha um conjunto pronto ou traga o seu. Fica guardado neste
            aparelho e vale só para você — nada sobe para o servidor.
          </p>
        </div>

        {picked > 0 && (
          <Button data-gc="configuracoes.cursores-section.button.clear" variant="surface" size="sm" onClick={clear}>
            <ArrowCounterClockwise data-gc="configuracoes.cursores-section.arrow-counter-clockwise" size={15} /> Voltar ao do sistema
          </Button>
        )}
      </header>

      <Bench data-gc="configuracoes.cursores-section.bench" />

      <section data-gc="configuracoes.cursores-section.section">
        <Title data-gc="configuracoes.cursores-section.title"
          title="Conjuntos prontos"
          detail="Um clique troca os seis papéis. Depois dá para trocar qualquer um deles sozinho."
        />

        <div data-gc="configuracoes.cursores-section.div--3" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CURSOR_PACKETS.map((packet) => (
            <PacketCard data-gc="configuracoes.cursores-section.packet-card" key={packet.id} packet={packet} />
          ))}
        </div>
      </section>

      <section data-gc="configuracoes.cursores-section.section--2">
        <Title data-gc="configuracoes.cursores-section.title--2"
          title="Um por um"
          detail={`${picked} de ${CURSOR_ROLES.length} trocados. O que você não escolher segue com o cursor do sistema.`}
        />

        <div data-gc="configuracoes.cursores-section.div--4" className="overflow-hidden rounded-xl border border-line">
          {CURSOR_ROLES.map((role, i) => (
            <RoleLine data-gc="configuracoes.cursores-section.role-line"
              key={role}
              role={role}
              first={i === 0}
              onOpenLibrary={() => setLibrary(role)}
            />
          ))}
        </div>

        <p data-gc="configuracoes.cursores-section.p--2" className="mt-3 text-xs leading-relaxed text-ink-faint">
          PNG, WebP ou SVG, até {CURSOR_LIMITS.side} pixels de lado. Acima
          disso o navegador ignora sem avisar e o cursor simplesmente não
          aparece. O tamanho que funciona bem é 32, ou 64 para telas retina. Não
          existe cursor animado: um GIF entraria parado no primeiro quadro, por
          isso ele é recusado na entrada.
        </p>
      </section>

      <PickLibrary data-gc="configuracoes.cursores-section.pick-library"
        role={inLibrary}
        onClose={() => setLibrary(null)}
        onPick={(cursor) => inLibrary && set(inLibrary, cursor)}
      />
    </div>
  );
};

const Title: React.FC<{ title: string; detail: string }> = ({ title, detail }) => (
  <div data-gc="configuracoes.cursores-section.div--5" className="mb-3">
    <h3 data-gc="configuracoes.cursores-section.h3" className="text-sm font-semibold">{title}</h3>
    <p data-gc="configuracoes.cursores-section.p--3" className="mt-0.5 text-xs text-ink-faint">{detail}</p>
  </div>
);

/*
  Cursor não se escolhe olhando, se escolhe usando. Esta faixa existe para a
  pessoa passar o ponteiro por um botão, um campo de texto e algo arrastável
  sem sair do painel — que são exatamente os papéis que ela acabou de trocar.
*/
const Bench: React.FC = () => (
  <section data-gc="configuracoes.cursores-section.section--3" className="rounded-xl border border-line bg-surface-2 p-4">
    <p data-gc="configuracoes.cursores-section.p--4" className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
      Passe o ponteiro aqui para testar
    </p>

    <div data-gc="configuracoes.cursores-section.div--6" className="flex flex-wrap items-center gap-2">
      <Button data-gc="configuracoes.cursores-section.button" size="sm">Botão</Button>
      <Button data-gc="configuracoes.cursores-section.button--2" size="sm" variant="surface" disabled>
        Desligado
      </Button>

      <input data-gc="configuracoes.cursores-section.input"
        readOnly
        value="Campo de texto"
        className="h-9 rounded-lg border border-line bg-surface-0 px-3 text-sm text-ink-muted outline-none"
      />

      <span data-gc="configuracoes.cursores-section.span" className="cursor-grab select-none rounded-lg border border-line bg-surface-3 px-3 py-2 text-sm active:cursor-grabbing">
        Arraste-me
      </span>
    </div>
  </section>
);

const PacketCard: React.FC<{ packet: CursorPacket }> = ({ packet }) => {
  const applyPacket = useCursors((s) => s.applyPacket);
  const cursors = useCursors((s) => s.cursors);

  const inUse = CURSOR_ROLES.every(
    (role) => cursors[role]?.image === packet.cursors[role].image,
  );

  return (
    <button data-gc="configuracoes.cursores-section.button--3"
      onClick={() => applyPacket(packet.cursors)}
      style={{ cursor: asRule(packet.cursors.padrao, "padrao") ?? undefined }}
      className={cn(
        "group flex flex-col gap-2 rounded-xl border p-3 text-left transition",
        inUse
          ? "border-brand bg-brand/10"
          : "border-line bg-surface-2 hover:border-surface-4 hover:bg-surface-3",
      )}
    >
      <span data-gc="configuracoes.cursores-section.span--2" className="flex items-center justify-between gap-1">
        <span data-gc="configuracoes.cursores-section.span--3" className="flex items-center gap-1">
          {CURSOR_ROLES.slice(0, 4).map((role) => (
            <img data-gc="configuracoes.cursores-section.img"
              key={role}
              src={packet.cursors[role].image}
              alt=""
              className="size-6 object-contain"
            />
          ))}
        </span>

        {inUse && (
          <span data-gc="configuracoes.cursores-section.span--4" className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-sobre-marca">
            <Check data-gc="configuracoes.cursores-section.check" size={12} weight="bold" />
          </span>
        )}
      </span>

      <span data-gc="configuracoes.cursores-section.span--5" className="text-sm font-semibold">{packet.name}</span>
      <span data-gc="configuracoes.cursores-section.span--6" className="text-11 leading-relaxed text-ink-faint">{packet.detail}</span>
    </button>
  );
};

const RoleLine: React.FC<{
  role: CursorRole;
  first: boolean;
  onOpenLibrary: () => void;
}> = ({ role, first, onOpenLibrary }) => {
  const cursor = useCursors((s) => s.cursors[role]);
  const set = useCursors((s) => s.set);

  const field = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const names = ROLES_NAMES[role];
  const rule = asRule(cursor ?? null, role);

  const pick = async (file: File | undefined) => {
    if (!file) return;

    setBusy(true);

    try {
      set(role, await readCursor(file));
    } catch (error) {
      toast.error(
        error instanceof CursorRefused ? error.message : "Não consegui usar essa imagem.",
      );
    } finally {
      setBusy(false);
      if (field.current) field.current.value = "";
    }
  };

  return (
    <div data-gc="configuracoes.cursores-section.div--7"
      style={{ cursor: rule ?? RESERVE[role] }}
      className={cn(
        "flex flex-wrap items-center gap-3 bg-surface-1 px-3 py-3 transition hover:bg-surface-2",
        !first && "border-t border-line",
      )}
    >
      <span data-gc="configuracoes.cursores-section.span--7" className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface-2">
        {cursor ? (
          <img data-gc="configuracoes.cursores-section.img--2" src={cursor.image} alt="" className="max-h-8 max-w-8 object-contain" />
        ) : (
          <span data-gc="configuracoes.cursores-section.span--8" className="text-10 uppercase tracking-wide text-ink-faint">sist.</span>
        )}
      </span>

      <div data-gc="configuracoes.cursores-section.div--8" className="min-w-0 flex-1 basis-48">
        <p data-gc="configuracoes.cursores-section.p--5" className="text-sm font-medium">{names.title}</p>
        <p data-gc="configuracoes.cursores-section.p--6" className="mt-0.5 text-xs text-ink-faint">{names.where}</p>

        {cursor && (
          <p data-gc="configuracoes.cursores-section.p--7" className="mt-1 text-11 text-ink-faint">
            {cursor.width}×{cursor.height} · clique em{" "}
            {dotAllowed(cursor.dotX, cursor.width)},
            {dotAllowed(cursor.dotY, cursor.height)}
          </p>
        )}
      </div>

      <div data-gc="configuracoes.cursores-section.div--9" className="ml-auto flex shrink-0 gap-2">
        {cursor && (
          <Button data-gc="configuracoes.cursores-section.button--4" variant="ghost" size="sm" onClick={() => set(role, null)}>
            Remover
          </Button>
        )}

        <Button data-gc="configuracoes.cursores-section.button--5"
          variant="surface"
          size="sm"
          disabled={busy}
          onClick={() => field.current?.click()}
        >
          <UploadSimple data-gc="configuracoes.cursores-section.upload-simple" size={14} /> {cursor ? "Trocar" : "Escolher"}
        </Button>
      </div>

      <input data-gc="configuracoes.cursores-section.input--2"
        ref={field}
        type="file"
        accept="image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
    </div>
  );
};
