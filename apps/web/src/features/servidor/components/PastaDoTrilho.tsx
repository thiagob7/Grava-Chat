import React, { useState } from "react";
import { CheckCheck, FolderOpen, Settings, Ungroup } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { VozNoServidor } from "@gravae/shared";

import { useMarcarServidorLido } from "~/@core/application/queries/guild/use-marcar-servidor-lido";
import type { GuildSummaryModel } from "~/@core/domain/models/guild-model";
import { Button } from "~/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input, Label } from "~/components/ui/input";
import { Tooltip } from "~/components/ui/tooltip";
import {
  ItemDoServidor,
  MarcaDeSoltar,
  TIPO_DE_ARRASTO,
  zonaDoPonteiro,
  type ZonaDeSoltar,
} from "~/features/servidor/components/ItemDoServidor";
import type { Destino, Pasta } from "~/features/servidor/lib/trilho";
import { usePastas } from "~/features/servidor/stores/pastas";
import { cn } from "~/lib/utils";

/// As cores da pasta são as do tema, e não hexadecimal cravado: seguem o tema junto.
const CORES = ["online", "idle", "dnd", "everyone", "link", "aviso"].map((nome) => `var(--color-${nome})`);

interface PastaDoTrilhoProps {
  pasta: Pasta;
  guilds: GuildSummaryModel[];
  activeGuildId: string | null;
  porServidor: Record<string, { naoLidas?: number; mencoes?: number }>;
  vozes: Record<string, VozNoServidor[]>;
  onSelect: (guildId: string) => void;
  onConvidar: (guildId: string) => void;
  onSoltar: (guildId: string, destino: Destino) => void;
}

/*
  A pasta do trilho: fechada, um quadrado com até quatro servidores dentro;
  aberta, uma coluna com todos eles. Clicar alterna. O botão direito marca
  tudo como lido, abre as configurações (nome e cor) ou desfaz a pasta.
*/
export const PastaDoTrilho: React.FC<PastaDoTrilhoProps> = ({
  pasta,
  guilds,
  activeGuildId,
  porServidor,
  vozes,
  onSelect,
  onConvidar,
  onSoltar,
}) => {
  const { t } = useTranslation();
  const alternar = usePastas((s) => s.alternar);
  const editar = usePastas((s) => s.editar);
  const desfazer = usePastas((s) => s.desfazer);
  const marcarLido = useMarcarServidorLido();
  const [zona, setZona] = useState<ZonaDeSoltar>(null);
  const [configurando, setConfigurando] = useState(false);

  const ativa = guilds.some((g) => g.id === activeGuildId);
  const naoLidas = guilds.reduce((n, g) => n + (porServidor[g.id]?.naoLidas ?? 0), 0);
  const mencoes = guilds.reduce((n, g) => n + (porServidor[g.id]?.mencoes ?? 0), 0);
  const nome = pasta.nome || guilds.map((g) => g.name).join(", ");
  const cor = pasta.cor ?? "var(--color-brand)";

  const arrastando = (e: React.DragEvent<HTMLElement>) => e.dataTransfer.types.includes(TIPO_DE_ARRASTO);

  const capa = (
    <button data-gc="servidor.pasta-do-trilho.button"
      type="button"
      onClick={() => alternar(pasta.id)}
      aria-label={nome}
      aria-expanded={pasta.aberta}
      className={cn(
        "flex size-[var(--guild-icon-size)] items-center justify-center overflow-hidden rounded-2xl transition-all duration-200 ease-out active:translate-y-px active:scale-95",
        pasta.aberta ? "bg-transparent" : "bg-surface-0 hover:bg-surface-3",
        zona === "juntar" && "ring-2 ring-brand ring-offset-2 ring-offset-surface-1",
      )}
      style={{ color: cor }}
    >
      {pasta.aberta ? (
        <FolderOpen data-gc="servidor.pasta-do-trilho.folder-open" size={22} />
      ) : (
        <span data-gc="servidor.pasta-do-trilho.span" className="grid size-9 grid-cols-2 gap-1">
          {guilds.slice(0, 4).map((g) => (
            <span data-gc="servidor.pasta-do-trilho.span--2" key={g.id} className="size-4 overflow-hidden rounded-full bg-surface-3 text-[8px] font-bold leading-4 text-ink">
              {g.iconUrl ? <img data-gc="servidor.pasta-do-trilho.img" src={g.iconUrl} alt="" draggable={false} className="size-full object-cover" /> : g.name.slice(0, 1)}
            </span>
          ))}
        </span>
      )}
    </button>
  );

  return (
    <>
      <ContextMenu data-gc="servidor.pasta-do-trilho.context-menu">
        <ContextMenuTrigger data-gc="servidor.pasta-do-trilho.context-menu-trigger" asChild>
          <div data-gc="servidor.pasta-do-trilho.div"
            className={cn(
              "group relative flex w-full flex-col items-center",
              pasta.aberta && "rounded-2xl bg-surface-0/60 pb-1",
            )}
            onDragOver={(e) => {
              if (!arrastando(e)) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setZona(pasta.aberta ? "juntar" : zonaDoPonteiro(e));
            }}
            onDragLeave={() => setZona(null)}
            onDrop={(e) => {
              const arrastado = e.dataTransfer.getData(TIPO_DE_ARRASTO);
              const z = pasta.aberta ? "juntar" : zonaDoPonteiro(e);
              setZona(null);
              if (!arrastado) return;
              e.preventDefault();
              e.stopPropagation();

              if (z === "juntar") onSoltar(arrastado, { tipo: "pasta", pastaId: pasta.id });
              else onSoltar(arrastado, { tipo: z === "antes" ? "antes" : "depois", de: `pasta:${pasta.id}` });
            }}
          >
            <MarcaDeSoltar data-gc="servidor.pasta-do-trilho.marca-de-soltar" zona={zona} />

            <div data-gc="servidor.pasta-do-trilho.div--2" className="relative flex w-full justify-center">
              <span data-gc="servidor.pasta-do-trilho.span--3"
                className={cn(
                  "absolute left-0 top-1/2 w-1 -translate-y-1/2 transition-all",
                  ativa && !pasta.aberta ? "h-10" : naoLidas > 0 && !pasta.aberta ? "h-2 group-hover:h-5" : "h-0 group-hover:h-5",
                )}
              >
                <span data-gc="servidor.pasta-do-trilho.span--4" className="block size-full rounded-r-full bg-pilula" />
              </span>

              <Tooltip data-gc="servidor.pasta-do-trilho.tooltip" side="right" label={nome}>{capa}</Tooltip>

              {mencoes > 0 && !pasta.aberta && (
                <span data-gc="servidor.pasta-do-trilho.span--5" className="pointer-events-none absolute bottom-0 right-3 flex min-w-[20px] items-center justify-center rounded-full border-2 border-surface-1 bg-danger px-1 text-11 font-bold leading-4 text-sobre-marca">
                  {mencoes > 99 ? "99+" : mencoes}
                </span>
              )}
            </div>

            {pasta.aberta && (
              <div data-gc="servidor.pasta-do-trilho.div--3" className="mt-2 flex w-full flex-col items-center gap-2">
                {guilds.map((guild) => (
                  <ItemDoServidor data-gc="servidor.pasta-do-trilho.item-do-servidor.on-select"
                    key={guild.id}
                    guild={guild}
                    active={guild.id === activeGuildId}
                    naoLidas={porServidor[guild.id]?.naoLidas ?? 0}
                    mencoes={porServidor[guild.id]?.mencoes ?? 0}
                    vozes={vozes[guild.id] ?? []}
                    onSelect={onSelect}
                    onConvidar={() => onConvidar(guild.id)}
                    onSoltar={onSoltar}
                    pastaId={pasta.id}
                  />
                ))}
              </div>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent data-gc="servidor.pasta-do-trilho.context-menu-content">
          <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item" onSelect={() => guilds.forEach((g) => marcarLido.mutate(g.id))}>
            {t("servidor.pasta.marcarLida")} <CheckCheck data-gc="servidor.pasta-do-trilho.check-check" size={14} />
          </ContextMenuItem>
          <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator" />
          <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--2" onSelect={() => setConfigurando(true)}>
            {t("servidor.pasta.configuracoes")} <Settings data-gc="servidor.pasta-do-trilho.settings" size={14} />
          </ContextMenuItem>
          <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--3" onSelect={() => desfazer(pasta.id)}>
            {t("servidor.pasta.desfazer")} <Ungroup data-gc="servidor.pasta-do-trilho.ungroup" size={14} />
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ConfiguracoesDaPasta data-gc="servidor.pasta-do-trilho.configuracoes-da-pasta"
        pasta={pasta}
        aberto={configurando}
        onFechar={() => setConfigurando(false)}
        onSalvar={(dados) => {
          editar(pasta.id, dados);
          setConfigurando(false);
        }}
      />
    </>
  );
};

const ConfiguracoesDaPasta: React.FC<{
  pasta: Pasta;
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (dados: { nome: string; cor: string | null }) => void;
}> = ({ pasta, aberto, onFechar, onSalvar }) => {
  const { t } = useTranslation();
  const [nome, setNome] = useState(pasta.nome);
  const [cor, setCor] = useState<string | null>(pasta.cor);

  return (
    <Dialog data-gc="servidor.pasta-do-trilho.dialog" open={aberto} onOpenChange={(a) => !a && onFechar()}>
      <DialogContent data-gc="servidor.pasta-do-trilho.dialog-content" className="max-w-sm">
        <DialogHeader data-gc="servidor.pasta-do-trilho.dialog-header">
          <DialogTitle data-gc="servidor.pasta-do-trilho.dialog-title">{t("servidor.pasta.titulo")}</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="servidor.pasta-do-trilho.dialog-body" className="space-y-5">
          <div data-gc="servidor.pasta-do-trilho.div--4">
            <Label data-gc="servidor.pasta-do-trilho.label" htmlFor="nome-da-pasta">{t("servidor.pasta.nome")}</Label>
            <Input data-gc="servidor.pasta-do-trilho.input" id="nome-da-pasta" value={nome} maxLength={32} placeholder={t("servidor.pasta.semNome")} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div data-gc="servidor.pasta-do-trilho.div--5">
            <Label data-gc="servidor.pasta-do-trilho.label--2">{t("servidor.pasta.cor")}</Label>
            <div data-gc="servidor.pasta-do-trilho.div--6" className="flex flex-wrap gap-2">
              {[null, ...CORES].map((opcao) => (
                <button data-gc="servidor.pasta-do-trilho.button--2"
                  key={opcao ?? "nenhuma"}
                  type="button"
                  aria-label={opcao ?? t("servidor.pasta.semCor")}
                  onClick={() => setCor(opcao)}
                  className={cn(
                    "size-8 rounded-full border-2 transition",
                    cor === opcao ? "border-ink" : "border-transparent hover:border-ink-faint",
                  )}
                  style={{ background: opcao ?? "var(--color-brand)" }}
                />
              ))}
            </div>
          </div>
        </DialogBody>

        <DialogFooter data-gc="servidor.pasta-do-trilho.dialog-footer">
          <Button data-gc="servidor.pasta-do-trilho.button.on-fechar" variant="surface" onClick={onFechar}>{t("comum.cancelar")}</Button>
          <Button data-gc="servidor.pasta-do-trilho.button--3" onClick={() => onSalvar({ nome: nome.trim(), cor })}>{t("servidor.pasta.salvar")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
