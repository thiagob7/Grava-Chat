import React, { useRef, useState } from "react";
import { ArrowCounterClockwise, Check, SquaresFour, UploadSimple } from "@phosphor-icons/react";
import { toast } from "react-toastify";

import { Button } from "~/components/ui/button";
import {
  CursorRecusado,
  LIMITES_DO_CURSOR,
  NOMES_DOS_PAPEIS,
  PAPEIS_DE_CURSOR,
  RESERVA,
  comoRegra,
  lerCursor,
  pontoPermitido,
  type PapelDeCursor,
} from "~/features/configuracoes/lib/cursor-importado";
import { PACOTES_DE_CURSOR, type PacoteDeCursor } from "~/features/configuracoes/lib/pacotes-de-cursor";
import { BIBLIOTECA_DE_CURSORES } from "~/features/configuracoes/lib/biblioteca-de-cursores";
import { EscolherDaBiblioteca } from "~/features/configuracoes/components/EscolherDaBiblioteca";
import { useCursores } from "~/features/configuracoes/stores/cursores";
import { cn } from "~/lib/utils";

export const CursoresSection: React.FC = () => {
  const cursores = useCursores((s) => s.cursores);
  const definir = useCursores((s) => s.definir);
  const limpar = useCursores((s) => s.limpar);

  const [naBiblioteca, setNaBiblioteca] = useState<PapelDeCursor | null>(null);

  const escolhidos = PAPEIS_DE_CURSOR.filter((papel) => cursores[papel]).length;

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

        {escolhidos > 0 && (
          <Button data-gc="configuracoes.cursores-section.button.limpar" variant="surface" size="sm" onClick={limpar}>
            <ArrowCounterClockwise data-gc="configuracoes.cursores-section.arrow-counter-clockwise" size={15} /> Voltar ao do sistema
          </Button>
        )}
      </header>

      <Bancada data-gc="configuracoes.cursores-section.bancada" />

      <section data-gc="configuracoes.cursores-section.section">
        <Titulo data-gc="configuracoes.cursores-section.titulo"
          titulo="Conjuntos prontos"
          detalhe="Um clique troca os seis papéis. Depois dá para trocar qualquer um deles sozinho."
        />

        <div data-gc="configuracoes.cursores-section.div--3" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {PACOTES_DE_CURSOR.map((pacote) => (
            <CartaoDePacote data-gc="configuracoes.cursores-section.cartao-de-pacote" key={pacote.id} pacote={pacote} />
          ))}
        </div>
      </section>

      <section data-gc="configuracoes.cursores-section.section--2">
        <Titulo data-gc="configuracoes.cursores-section.titulo--2"
          titulo="Um por um"
          detalhe={`${escolhidos} de ${PAPEIS_DE_CURSOR.length} trocados. O que você não escolher segue com o cursor do sistema.`}
        />

        <div data-gc="configuracoes.cursores-section.div--4" className="overflow-hidden rounded-xl border border-line">
          {PAPEIS_DE_CURSOR.map((papel, i) => (
            <LinhaDoPapel data-gc="configuracoes.cursores-section.linha-do-papel"
              key={papel}
              papel={papel}
              primeira={i === 0}
              onAbrirBiblioteca={() => setNaBiblioteca(papel)}
            />
          ))}
        </div>

        <p data-gc="configuracoes.cursores-section.p--2" className="mt-3 text-xs leading-relaxed text-ink-faint">
          PNG, WebP ou SVG, até {LIMITES_DO_CURSOR.lado} pixels de lado. Acima
          disso o navegador ignora sem avisar e o cursor simplesmente não
          aparece. O tamanho que funciona bem é 32, ou 64 para telas retina. Não
          existe cursor animado: um GIF entraria parado no primeiro quadro, por
          isso ele é recusado na entrada.
        </p>
      </section>

      <EscolherDaBiblioteca data-gc="configuracoes.cursores-section.escolher-da-biblioteca"
        papel={naBiblioteca}
        onFechar={() => setNaBiblioteca(null)}
        onEscolher={(cursor) => naBiblioteca && definir(naBiblioteca, cursor)}
      />
    </div>
  );
};

const Titulo: React.FC<{ titulo: string; detalhe: string }> = ({ titulo, detalhe }) => (
  <div data-gc="configuracoes.cursores-section.div--5" className="mb-3">
    <h3 data-gc="configuracoes.cursores-section.h3" className="text-sm font-semibold">{titulo}</h3>
    <p data-gc="configuracoes.cursores-section.p--3" className="mt-0.5 text-xs text-ink-faint">{detalhe}</p>
  </div>
);

/*
  Cursor não se escolhe olhando, se escolhe usando. Esta faixa existe para a
  pessoa passar o ponteiro por um botão, um campo de texto e algo arrastável
  sem sair do painel — que são exatamente os papéis que ela acabou de trocar.
*/
const Bancada: React.FC = () => (
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

const CartaoDePacote: React.FC<{ pacote: PacoteDeCursor }> = ({ pacote }) => {
  const aplicarPacote = useCursores((s) => s.aplicarPacote);
  const cursores = useCursores((s) => s.cursores);

  const emUso = PAPEIS_DE_CURSOR.every(
    (papel) => cursores[papel]?.imagem === pacote.cursores[papel].imagem,
  );

  return (
    <button data-gc="configuracoes.cursores-section.button--3"
      onClick={() => aplicarPacote(pacote.cursores)}
      style={{ cursor: comoRegra(pacote.cursores.padrao, "padrao") ?? undefined }}
      className={cn(
        "group flex flex-col gap-2 rounded-xl border p-3 text-left transition",
        emUso
          ? "border-brand bg-brand/10"
          : "border-line bg-surface-2 hover:border-surface-4 hover:bg-surface-3",
      )}
    >
      <span data-gc="configuracoes.cursores-section.span--2" className="flex items-center justify-between gap-1">
        <span data-gc="configuracoes.cursores-section.span--3" className="flex items-center gap-1">
          {PAPEIS_DE_CURSOR.slice(0, 4).map((papel) => (
            <img data-gc="configuracoes.cursores-section.img"
              key={papel}
              src={pacote.cursores[papel].imagem}
              alt=""
              className="size-6 object-contain"
            />
          ))}
        </span>

        {emUso && (
          <span data-gc="configuracoes.cursores-section.span--4" className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-sobre-marca">
            <Check data-gc="configuracoes.cursores-section.check" size={12} weight="bold" />
          </span>
        )}
      </span>

      <span data-gc="configuracoes.cursores-section.span--5" className="text-sm font-semibold">{pacote.nome}</span>
      <span data-gc="configuracoes.cursores-section.span--6" className="text-11 leading-relaxed text-ink-faint">{pacote.detalhe}</span>
    </button>
  );
};

const LinhaDoPapel: React.FC<{
  papel: PapelDeCursor;
  primeira: boolean;
  onAbrirBiblioteca: () => void;
}> = ({ papel, primeira, onAbrirBiblioteca }) => {
  const cursor = useCursores((s) => s.cursores[papel]);
  const definir = useCursores((s) => s.definir);

  const campo = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);

  const nomes = NOMES_DOS_PAPEIS[papel];
  const regra = comoRegra(cursor ?? null, papel);

  const escolher = async (arquivo: File | undefined) => {
    if (!arquivo) return;

    setOcupado(true);

    try {
      definir(papel, await lerCursor(arquivo));
    } catch (erro) {
      toast.error(
        erro instanceof CursorRecusado ? erro.message : "Não consegui usar essa imagem.",
      );
    } finally {
      setOcupado(false);
      if (campo.current) campo.current.value = "";
    }
  };

  return (
    <div data-gc="configuracoes.cursores-section.div--7"
      style={{ cursor: regra ?? RESERVA[papel] }}
      className={cn(
        "flex flex-wrap items-center gap-3 bg-surface-1 px-3 py-3 transition hover:bg-surface-2",
        !primeira && "border-t border-line",
      )}
    >
      <span data-gc="configuracoes.cursores-section.span--7" className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface-2">
        {cursor ? (
          <img data-gc="configuracoes.cursores-section.img--2" src={cursor.imagem} alt="" className="max-h-8 max-w-8 object-contain" />
        ) : (
          <span data-gc="configuracoes.cursores-section.span--8" className="text-10 uppercase tracking-wide text-ink-faint">sist.</span>
        )}
      </span>

      <div data-gc="configuracoes.cursores-section.div--8" className="min-w-0 flex-1 basis-48">
        <p data-gc="configuracoes.cursores-section.p--5" className="text-sm font-medium">{nomes.titulo}</p>
        <p data-gc="configuracoes.cursores-section.p--6" className="mt-0.5 text-xs text-ink-faint">{nomes.onde}</p>

        {cursor && (
          <p data-gc="configuracoes.cursores-section.p--7" className="mt-1 text-11 text-ink-faint">
            {cursor.largura}×{cursor.altura} · clique em{" "}
            {pontoPermitido(cursor.pontoX, cursor.largura)},
            {pontoPermitido(cursor.pontoY, cursor.altura)}
          </p>
        )}
      </div>

      <div data-gc="configuracoes.cursores-section.div--9" className="ml-auto flex shrink-0 gap-2">
        {cursor && (
          <Button data-gc="configuracoes.cursores-section.button--4" variant="ghost" size="sm" onClick={() => definir(papel, null)}>
            Remover
          </Button>
        )}

        <Button data-gc="configuracoes.cursores-section.button--5"
          variant="surface"
          size="sm"
          disabled={ocupado}
          onClick={() => campo.current?.click()}
        >
          <UploadSimple data-gc="configuracoes.cursores-section.upload-simple" size={14} /> {cursor ? "Trocar" : "Escolher"}
        </Button>
      </div>

      <input data-gc="configuracoes.cursores-section.input--2"
        ref={campo}
        type="file"
        accept="image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => void escolher(e.target.files?.[0])}
      />
    </div>
  );
};
