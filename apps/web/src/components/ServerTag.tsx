import React, { useState } from "react";
import { useNavigate } from "react-router";

import { useGuildPreview } from "~/@core/application/queries/guild/use-guild-preview";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { avatarColor } from "~/lib/format";

interface ServerTagProps {
  /** já resolvida pelo servidor: quem lê não teria como resolver o id sozinho */
  etiqueta?: { guildId: string; tag: string; tagIcon: string | null } | null;
  /**
   * `false` dentro de outro botão — a linha da lista de membros é um botão
   * inteiro, e botão dentro de botão o navegador reaninha calado: o clique de
   * dentro simplesmente para de existir. Lá a etiqueta é só o selo; clicável ela
   * fica no cartão que a própria linha abre.
   */
  interativo?: boolean;
}

/**
 * A etiqueta de servidor que a PESSOA escolheu vestir.
 *
 * Ela acompanha quem a veste em todo lugar — nos outros servidores e na conversa
 * privada. Antes era a etiqueta do servidor aberto, aplicada a todos os membros
 * dele: com isso ela dizia "você está aqui" em vez de "eu sou de lá", que é o
 * ponto de existir uma etiqueta.
 *
 * Clicar abre o servidor por trás dela. É o que fecha o ciclo: a etiqueta deixa
 * de ser um enfeite e vira a porta de entrada de uma comunidade.
 */
const SELO = "flex shrink-0 items-center gap-0.5 rounded bg-brand/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand";

export const ServerTag: React.FC<ServerTagProps> = ({ etiqueta, interativo = true }) => {
  const [aberto, setAberto] = useState(false);
  if (!etiqueta) return null;

  if (!interativo) {
    return (
      <span title={`Etiqueta de servidor: ${etiqueta.tag}`} className={SELO}>
        {etiqueta.tagIcon} {etiqueta.tag}
      </span>
    );
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          title={`Etiqueta de servidor: ${etiqueta.tag}`}
          className={`${SELO} transition hover:bg-brand/30`}
        >
          {etiqueta.tagIcon} {etiqueta.tag}
        </button>
      </PopoverTrigger>

      <PopoverContent side="bottom" align="start" className="w-72 overflow-hidden p-0">
        {aberto && <CartaoDoServidor guildId={etiqueta.guildId} onIr={() => setAberto(false)} />}
      </PopoverContent>
    </Popover>
  );
};

const CartaoDoServidor: React.FC<{ guildId: string; onIr: () => void }> = ({ guildId, onIr }) => {
  const navigate = useNavigate();
  const { data: servidor, isLoading } = useGuildPreview(guildId);

  if (isLoading || !servidor) {
    return <div className="p-6 text-sm text-ink-faint">Carregando…</div>;
  }

  return (
    <>
      {/* a faixa é a cor gerada do id: servidor não tem banner próprio ainda */}
      <div className="h-16" style={{ backgroundColor: avatarColor(servidor.id) }} />

      <div className="px-4 pb-4">
        <div className="-mt-8 mb-2 size-16 overflow-hidden rounded-2xl bg-surface-3 ring-4 ring-surface-0">
          {servidor.iconUrl ? (
            <img src={servidor.iconUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-xl font-bold">
              {servidor.name.slice(0, 2)}
            </span>
          )}
        </div>

        <p className="flex items-center gap-1.5 font-bold leading-tight">
          <span className="min-w-0 truncate">{servidor.name}</span>
          <span className={SELO}>
            {servidor.tagIcon} {servidor.tag}
          </span>
        </p>

        <p className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-online" />
            {servidor.onlineCount} online
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-ink-faint" />
            {servidor.memberCount} {servidor.memberCount === 1 ? "membro" : "membros"}
          </span>
        </p>

        <p className="mt-1 text-xs text-ink-faint">
          Desde{" "}
          {new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(
            new Date(servidor.createdAt),
          )}
        </p>

        {servidor.description && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-ink-muted">{servidor.description}</p>
        )}

        {servidor.souMembro ? (
          <Button
            variant="success"
            className="mt-4 w-full"
            onClick={() => {
              onIr();
              navigate(`/channels/${servidor.id}`);
            }}
          >
            Ir para o servidor
          </Button>
        ) : (
          /* sem convite não há entrada: a etiqueta anuncia, ela não abre a porta */
          <p className="mt-4 text-center text-xs text-ink-faint">
            Você precisa de um convite para entrar
          </p>
        )}
      </div>
    </>
  );
};
