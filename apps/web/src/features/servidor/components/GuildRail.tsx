import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowDownToLine, Compass, Download, Plus, RotateCw } from "lucide-react";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useReadStatesPorServidor } from "~/@core/application/queries/message/use-read-states";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";
import { AdicionarServidorModal } from "~/features/servidor/components/AdicionarServidorModal";
import { Tooltip } from "~/components/ui/tooltip";
import { InviteModal } from "~/features/servidor/components/InviteModal";
import { ItemDoServidor, TIPO_DE_ARRASTO } from "~/features/servidor/components/ItemDoServidor";
import { PastaDoTrilho } from "~/features/servidor/components/PastaDoTrilho";
import { montarTrilho, type Destino } from "~/features/servidor/lib/trilho";
import { usePastas } from "~/features/servidor/stores/pastas";
import { useVoiceStates } from "~/@core/application/queries/voice/use-voice-states";
import { desktop, ehDesktop } from "~/lib/desktop";
import { useAtalhoGlobal } from "~/features/app/hooks/use-atalho-global";
import { useAtualizacao } from "~/features/app/hooks/use-atualizacao";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";
import { flx, flxAttr, flxCls, type Lugares } from "~/lib/compat-de-tema";

interface GuildRailProps {
  activeGuildId: string | null;
  onSelect: (guildId: string) => void;
  onOpenFriends: () => void;
  pendingFriendRequests: number;
}

const ehMac =
  desktop()?.plataforma === "darwin" ||
  (typeof navigator !== "undefined" && /Mac/.test(navigator.platform));

export const GuildRail: React.FC<GuildRailProps> = ({
  activeGuildId,
  onSelect,
  onOpenFriends,
  pendingFriendRequests,
}) => {
  const { t } = useTranslation();
  const { data: guilds = [] } = useFindManyGuilds(true);
  const [convidandoEm, setConvidandoEm] = useState<string | null>(null);
  const arrumacao = usePastas((s) => s.arrumacao);
  const mover = usePastas((s) => s.mover);
  const [soltandoNoFim, setSoltandoNoFim] = useState(false);
  const itens = montarTrilho(guilds, arrumacao);
  const soltar = (guildId: string, destino: Destino) => mover(guilds.map((g) => g.id), guildId, destino);
  const { data: porServidor = {} } = useReadStatesPorServidor(true);
  const { data: vozes = {} } = useVoiceStates(true);
  const [creating, setCreating] = useState(false);
  const abrirConfiguracoes = useConfiguracoes((s) => s.abrir);
  const navigate = useNavigate();
  const atualizacao = useAtualizacao();

  useAtalhoGlobal("servidor-novo", () => setCreating(true));
  useAtalhoGlobal("configuracoes", () => abrirConfiguracoes("conta"));

  return (
    <>
      <nav data-gc="servidor.guild-rail.nav" {...flx("trilhoDeServidores", "trilho-de-servidores flex w-[var(--layout-guild-list-width)] shrink-0 flex-col border-r border-line-sutil bg-surface-1")}>
        <div data-gc="servidor.guild-rail.div" {...flx("roladorDoTrilho", "flex min-h-0 flex-1 flex-col overflow-y-auto")}>
        <div data-gc="servidor.guild-rail.div--2" {...flx("conteudoDoTrilho", "flex flex-col items-center gap-2 pb-36 pt-3")}>
        <div data-gc="servidor.guild-rail.div--3" {...flx("secaoDoTopoDoTrilho", "flex w-full flex-col items-center gap-2")}>
        <div data-gc="servidor.guild-rail.div--4" {...flx("itemDoTrilho", "group relative flex w-full justify-center")}>
          <span data-gc="servidor.guild-rail.span"
            {...flx(
              "pilulaDoServidor",
              cn(
                "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-pilula transition-all",
                activeGuildId === null ? "h-10" : "h-0 group-hover:h-5",
              ),
            )}
          />
          <Tooltip data-gc="servidor.guild-rail.tooltip" label="Amigos e mensagens diretas" side="right">
            <button data-gc="servidor.guild-rail.button.on-open-friends"
              onClick={onOpenFriends}
              className={cn(
                "relative flex size-[var(--guild-icon-size)] items-center justify-center text-xl font-bold transition-all",
                activeGuildId === null
                  ? "rounded-2xl bg-brand"
                  : "rounded-3xl bg-surface-0 hover:rounded-2xl hover:bg-brand",
              )}
            >
              <img data-gc="servidor.guild-rail.img"
                src="/brand/logo%20g%20branco.svg"
                alt=""
                className="h-6 w-auto object-contain"
                draggable={false}
              />
              {pendingFriendRequests > 0 && (
                <span data-gc="servidor.guild-rail.span--2" {...flx("seloDoServidor", "absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-surface-1 bg-danger text-10 font-bold text-sobre-marca")}>
                  {pendingFriendRequests}
                </span>
              )}
            </button>
          </Tooltip>
        </div>

        <div data-gc="servidor.guild-rail.div--5" {...flx("divisorDoTrilho", "my-1 h-0.5 w-8 rounded-full bg-surface-3")} />
        </div>

        <div data-gc="servidor.guild-rail.div--6" {...flx("secaoDeServidores", "flex w-full flex-col items-center gap-2")}>

        {itens.map((item) =>
          item.tipo === "pasta" ? (
            <PastaDoTrilho data-gc="servidor.guild-rail.pasta-do-trilho.on-select"
              key={`pasta:${item.pasta.id}`}
              pasta={item.pasta}
              guilds={item.guilds}
              activeGuildId={activeGuildId}
              porServidor={porServidor}
              vozes={vozes}
              onSelect={onSelect}
              onConvidar={setConvidandoEm}
              onSoltar={soltar}
            />
          ) : (
            <ItemDoServidor data-gc="servidor.guild-rail.item-do-servidor.on-select"
              key={item.guild.id}
              guild={item.guild}
              active={item.guild.id === activeGuildId}
              naoLidas={porServidor[item.guild.id]?.naoLidas ?? 0}
              mencoes={porServidor[item.guild.id]?.mencoes ?? 0}
              vozes={vozes[item.guild.id] ?? []}
              onSelect={onSelect}
              onConvidar={() => setConvidandoEm(item.guild.id)}
              onSoltar={soltar}
            />
          ),
        )}

        <div data-gc="servidor.guild-rail.div--7"
          aria-hidden
          className={cn("h-2 w-full transition-all", soltandoNoFim && "h-6")}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes(TIPO_DE_ARRASTO)) return;
            e.preventDefault();
            setSoltandoNoFim(true);
          }}
          onDragLeave={() => setSoltandoNoFim(false)}
          onDrop={(e) => {
            const arrastado = e.dataTransfer.getData(TIPO_DE_ARRASTO);
            setSoltandoNoFim(false);
            if (!arrastado) return;
            e.preventDefault();
            soltar(arrastado, { tipo: "fim" });
          }}
        />
        </div>

        {guilds.length > 0 && (
          <div data-gc="servidor.guild-rail.div--8" className="my-1 h-0.5 w-8 rounded-full bg-surface-3" />
        )}

        <AcaoDoTrilho data-gc="servidor.guild-rail.acao-do-trilho"
          label="Criar ou entrar num servidor"
          lugar="botaoDeCriarServidor"
          atalho={[ehMac ? "⌘" : "Ctrl", "Shift", "N"]}
          onClick={() => setCreating(true)}
        >
          <Plus data-gc="servidor.guild-rail.plus" size={22} className={flxCls("iconeDeCriarServidor")} />
        </AcaoDoTrilho>

        <AcaoDoTrilho data-gc="servidor.guild-rail.acao-do-trilho--2" label="Explorar comunidades" lugar="botaoDeExplorar" onClick={() => navigate("/explorar")}>
          <Compass data-gc="servidor.guild-rail.compass" size={22} />
        </AcaoDoTrilho>

        {!ehDesktop() ? (
          <AcaoDoTrilho data-gc="servidor.guild-rail.acao-do-trilho--3" label="Baixar o aplicativo" onClick={() => abrirConfiguracoes("aplicativo")}>
            <Download data-gc="servidor.guild-rail.download" size={20} />
          </AcaoDoTrilho>
        ) : (
          atualizacao.temNovidade && (
            <Tooltip data-gc="servidor.guild-rail.tooltip--2"
              side="right"
              label={
                atualizacao.instalando
                  ? `Instalando a versão ${atualizacao.estado?.disponivel}…`
                  : atualizacao.estado?.erro && atualizacao.pronta
                    ? `${atualizacao.estado.erro} Clique para tentar de novo.`
                    : atualizacao.pronta
                      ? `Versão ${atualizacao.estado?.disponivel} pronta — clique para reiniciar`
                      : atualizacao.baixando
                        ? `Baixando a versão ${atualizacao.estado?.disponivel}…`
                        : `Saiu a versão ${atualizacao.estado?.disponivel} — clique para baixar`
              }
            >
              <button data-gc="servidor.guild-rail.button"
                aria-label="Atualização do aplicativo"
                disabled={atualizacao.baixando || atualizacao.instalando}
                onClick={() =>
                  void (atualizacao.pronta
                    ? atualizacao.ponte?.instalar()
                    : atualizacao.ponte?.baixar())
                }
                className={cn(
                  "relative flex size-12 items-center justify-center rounded-3xl border-2 border-dashed transition-all",
                  "hover:rounded-2xl disabled:cursor-default",
                  atualizacao.estado?.erro && atualizacao.pronta
                    ? "border-danger text-danger hover:bg-danger-fundo"
                    : atualizacao.pronta || atualizacao.instalando
                      ? "border-online text-online hover:bg-online/10"
                      : "border-surface-4 text-ink-muted hover:border-ink hover:text-ink",
                )}
              >
                {atualizacao.instalando ? (
                  <RotateCw data-gc="servidor.guild-rail.rotate-cw" size={20} className="animate-spin" />
                ) : atualizacao.baixando ? (
                  <ArrowDownToLine data-gc="servidor.guild-rail.arrow-down-to-line" size={20} className="animate-pulse" />
                ) : (
                  <ArrowDownToLine data-gc="servidor.guild-rail.arrow-down-to-line--2" size={20} />
                )}

                {atualizacao.pronta && (
                  <span data-gc="servidor.guild-rail.span--3" className="absolute right-0 top-0 size-3 rounded-full border-2 border-surface-1 bg-online" />
                )}
              </button>
            </Tooltip>
          )
        )}
        </div>
        </div>
      </nav>

      <AdicionarServidorModal data-gc="servidor.guild-rail.adicionar-servidor-modal.on-select"
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={onSelect}
      />
      <InviteModal data-gc="servidor.guild-rail.invite-modal"
        open={convidandoEm !== null}
        guildId={convidandoEm ?? ""}
        guildName={guilds.find((g) => g.id === convidandoEm)?.name ?? ""}
        onClose={() => setConvidandoEm(null)}
      />
    </>
  );
};

const AcaoDoTrilho: React.FC<{
  label: string;
  atalho?: string[];
  lugar?: Lugares;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, atalho, lugar, onClick, children }) => (
  <Tooltip data-gc="servidor.guild-rail.tooltip--3" label={label} shortcut={atalho} side="right">
    <button data-gc="servidor.guild-rail.button.on-click"
      {...(lugar ? flxAttr(lugar) : {})}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-12 items-center justify-center rounded-3xl border-2 border-dashed border-surface-4 text-ink-muted transition-all",
        "hover:rounded-2xl hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </button>
  </Tooltip>
);
