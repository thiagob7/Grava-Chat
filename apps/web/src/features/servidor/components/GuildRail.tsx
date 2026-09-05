import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowDownToLine, Compass, Download, Plus, RotateCw } from "lucide-react";
import { Headphones, MonitorPlay } from "@phosphor-icons/react";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useReadStatesPorServidor } from "~/@core/application/queries/message/use-read-states";
import { avatarColor, initials } from "~/lib/format";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";
import { AdicionarServidorModal } from "~/features/servidor/components/AdicionarServidorModal";
import { Tooltip } from "~/components/ui/tooltip";
import { DicaDoServidor } from "~/features/servidor/components/DicaDoServidor";
import { useVoiceStates } from "~/@core/application/queries/voice/use-voice-states";
import { desktop, ehDesktop } from "~/lib/desktop";
import { useAtalhoGlobal } from "~/features/app/hooks/use-atalho-global";
import { useAtualizacao } from "~/features/app/hooks/use-atualizacao";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";
import { flx } from "~/lib/compat-fluxer";

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
      <nav data-gc="servidor.guild-rail.nav" {...flx("trilhoDeServidores", "trilho-de-servidores flex w-[var(--layout-guild-list-width)] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-surface-1 pb-36 pt-3")}>
        <div data-gc="servidor.guild-rail.div" {...flx("itemDoTrilho", "group relative flex w-full justify-center")}>
          <span data-gc="servidor.guild-rail.span"
            className={cn(
              "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-pilula transition-all",
              activeGuildId === null ? "h-10" : "h-0 group-hover:h-5",
            )}
          />
          <Tooltip data-gc="servidor.guild-rail.tooltip" label="Amigos e mensagens diretas" side="right">
            <button data-gc="servidor.guild-rail.button.on-open-friends"
              onClick={onOpenFriends}
              className={cn(
                "relative flex size-12 items-center justify-center text-xl font-bold transition-all",
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
                <span data-gc="servidor.guild-rail.span--2" className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-surface-1 bg-danger text-10 font-bold text-white">
                  {pendingFriendRequests}
                </span>
              )}
            </button>
          </Tooltip>
        </div>

        <div data-gc="servidor.guild-rail.div--2" className="my-1 h-0.5 w-8 rounded-full bg-surface-3" />

        {guilds.map((guild) => {
          const active = guild.id === activeGuildId;
          const { naoLidas = 0, mencoes = 0 } = porServidor[guild.id] ?? {};
          const emVoz = vozes[guild.id] ?? [];
          const transmitindo = emVoz.some((canal) => canal.transmitindo);
          const naChamada = emVoz.reduce((total, canal) => total + canal.pessoas.length, 0);

          const temNovidade = !active && naoLidas > 0;

          return (
            <div data-gc="servidor.guild-rail.div--3" key={guild.id} className="group relative flex w-full justify-center">
              <span data-gc="servidor.guild-rail.span--3"
                className={cn(
                  "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-pilula transition-all",
                  active ? "h-10" : temNovidade ? "h-2 group-hover:h-5" : "h-0 group-hover:h-5",
                )}
              />
              <DicaDoServidor data-gc="servidor.guild-rail.dica-do-servidor" nome={guild.name} vozes={vozes[guild.id] ?? []}>
                <button data-gc="servidor.guild-rail.button"
                  onClick={() => onSelect(guild.id)}
                  className={cn(
                    "flex size-12 items-center justify-center overflow-hidden font-semibold transition-all",
                    active
                      ? "rounded-2xl bg-brand"
                      : "rounded-3xl bg-surface-0 hover:rounded-2xl hover:bg-brand",
                  )}
                  style={!active && !guild.iconUrl ? { color: avatarColor(guild.id) } : undefined}
                >
                  {guild.iconUrl ? (
                    <img data-gc="servidor.guild-rail.img--2" src={guild.iconUrl} alt={guild.name} className="size-full object-cover" />
                  ) : (
                    initials(guild.name)
                  )}
                </button>
              </DicaDoServidor>

              {naChamada > 0 && (
                <span data-gc="servidor.guild-rail.span--4"
                  title={
                    transmitindo
                      ? t("servidor.trilho.transmitindo")
                      : t("servidor.trilho.emChamada", { count: naChamada })
                  }
                  className="pointer-events-none absolute -top-0.5 right-2 flex size-5 items-center justify-center rounded-full border-2 border-surface-1 bg-surface-0 text-ink"
                >
                  {transmitindo ? (
                    <MonitorPlay data-gc="servidor.guild-rail.monitor-play" size={11} weight="fill" />
                  ) : (
                    <Headphones data-gc="servidor.guild-rail.headphones" size={11} weight="fill" />
                  )}
                </span>
              )}

              {mencoes > 0 && (
                <span data-gc="servidor.guild-rail.span--5"
                  title={`${mencoes} menção${mencoes === 1 ? "" : "ões"} a você`}
                  className="pointer-events-none absolute bottom-0 right-3 flex min-w-[20px] items-center justify-center rounded-full border-2 border-surface-1 bg-danger px-1 text-11 font-bold leading-4 text-white"
                >
                  {mencoes > 99 ? "99+" : mencoes}
                </span>
              )}
            </div>
          );
        })}

        {guilds.length > 0 && (
          <div data-gc="servidor.guild-rail.div--4" className="my-1 h-0.5 w-8 rounded-full bg-surface-3" />
        )}

        <AcaoDoTrilho data-gc="servidor.guild-rail.acao-do-trilho"
          label="Criar ou entrar num servidor"
          atalho={[ehMac ? "⌘" : "Ctrl", "Shift", "N"]}
          onClick={() => setCreating(true)}
        >
          <Plus data-gc="servidor.guild-rail.plus" size={22} />
        </AcaoDoTrilho>

        <AcaoDoTrilho data-gc="servidor.guild-rail.acao-do-trilho--2" label="Explorar comunidades" onClick={() => navigate("/explorar")}>
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
              <button data-gc="servidor.guild-rail.button--2"
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
                    ? "border-danger text-danger hover:bg-danger/10"
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
                  <span data-gc="servidor.guild-rail.span--6" className="absolute right-0 top-0 size-3 rounded-full border-2 border-surface-1 bg-online" />
                )}
              </button>
            </Tooltip>
          )
        )}
      </nav>

      <AdicionarServidorModal data-gc="servidor.guild-rail.adicionar-servidor-modal.on-select"
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={onSelect}
      />
    </>
  );
};

const AcaoDoTrilho: React.FC<{
  label: string;
  atalho?: string[];
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, atalho, onClick, children }) => (
  <Tooltip data-gc="servidor.guild-rail.tooltip--3" label={label} atalho={atalho} side="right">
    <button data-gc="servidor.guild-rail.button.on-click"
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
