import React, { useState } from "react";
import { Download, Plus } from "lucide-react";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useReadStatesPorServidor } from "~/@core/application/queries/message/use-read-states";
import { avatarColor, initials } from "~/lib/format";
import { cn } from "~/lib/utils";
import { CreateGuildModal } from "~/components/CreateGuildModal";
import { Tooltip } from "~/components/ui/tooltip";
import { ehDesktop } from "~/lib/desktop";
import { useConfiguracoes } from "~/stores/configuracoes";

interface GuildRailProps {
  activeGuildId: string | null;
  onSelect: (guildId: string) => void;
  onOpenFriends: () => void;
  pendingFriendRequests: number;
}

export const GuildRail: React.FC<GuildRailProps> = ({
  activeGuildId,
  onSelect,
  onOpenFriends,
  pendingFriendRequests,
}) => {
  const { data: guilds = [] } = useFindManyGuilds(true);
  const { data: porServidor = {} } = useReadStatesPorServidor(true);
  const [creating, setCreating] = useState(false);
  const abrirConfiguracoes = useConfiguracoes((s) => s.abrir);

  return (
    <>
      <nav className="trilho-de-servidores flex w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-surface-0 pb-36 pt-3">
        <div className="group relative flex w-full justify-center">
          <span
            className={cn(
              "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-pilula transition-all",
              activeGuildId === null ? "h-10" : "h-0 group-hover:h-5",
            )}
          />
          <Tooltip label="Amigos e mensagens diretas" side="right">
            <button
              onClick={onOpenFriends}
              className={cn(
                "relative flex size-12 items-center justify-center text-xl font-bold transition-all",
                activeGuildId === null
                  ? "rounded-2xl bg-brand"
                  : "rounded-3xl bg-surface-1 hover:rounded-2xl hover:bg-brand",
              )}
            >
              <img
                src="/brand/logo%20g%20branco.svg"
                alt=""
                className="h-6 w-auto object-contain"
                draggable={false}
              />
              {pendingFriendRequests > 0 && (
                <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-surface-0 bg-danger text-[10px] font-bold text-white">
                  {pendingFriendRequests}
                </span>
              )}
            </button>
          </Tooltip>
        </div>

        <div className="my-1 h-0.5 w-8 rounded-full bg-surface-3" />

        {guilds.map((guild) => {
          const active = guild.id === activeGuildId;
          const { naoLidas = 0, mencoes = 0 } = porServidor[guild.id] ?? {};

          /*
            A barrinha branca da esquerda diz três coisas com o mesmo traço,
            como no Discord: comprida = servidor aberto, curta e redonda = tem
            mensagem nova, nada = tudo lido. O número vermelho é outra coisa —
            é menção, e menção não se descobre rolando o chat.

            Servidor aberto não mostra a marca de não-lido: você está lendo.
          */
          const temNovidade = !active && naoLidas > 0;

          return (
            <div key={guild.id} className="group relative flex w-full justify-center">
              <span
                className={cn(
                  "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-pilula transition-all",
                  active ? "h-10" : temNovidade ? "h-2 group-hover:h-5" : "h-0 group-hover:h-5",
                )}
              />
              <Tooltip label={guild.name} side="right">
                <button
                  onClick={() => onSelect(guild.id)}
                  className={cn(
                    "flex size-12 items-center justify-center overflow-hidden font-semibold transition-all",
                    active
                      ? "rounded-2xl bg-brand"
                      : "rounded-3xl bg-surface-1 hover:rounded-2xl hover:bg-brand",
                  )}
                  style={!active && !guild.iconUrl ? { color: avatarColor(guild.id) } : undefined}
                >
                  {guild.iconUrl ? (
                    <img src={guild.iconUrl} alt={guild.name} className="size-full object-cover" />
                  ) : (
                    initials(guild.name)
                  )}
                </button>
              </Tooltip>

              {mencoes > 0 && (
                <span
                  title={`${mencoes} menção${mencoes === 1 ? "" : "ões"} a você`}
                  /*
                    Fora do botão, não dentro: o ícone do servidor tem
                    `overflow-hidden` para recortar a foto no quadrado
                    arredondado, e qualquer selo desenhado lá dentro sumiria
                    junto com o canto.
                  */
                  className="pointer-events-none absolute bottom-0 right-3 flex min-w-[20px] items-center justify-center rounded-full border-2 border-surface-0 bg-danger px-1 text-[11px] font-bold leading-4 text-white"
                >
                  {mencoes > 99 ? "99+" : mencoes}
                </span>
              )}
            </div>
          );
        })}

        {/*
          Sem este guarda, quem nao tem servidor ve dois tracinhos colados: o
          de cima separa as mensagens da lista, e este separaria a lista do "+"
          — mas nao ha lista nenhuma no meio.
        */}
        {guilds.length > 0 && (
          <div className="my-1 h-0.5 w-8 rounded-full bg-surface-3" />
        )}

        <AcaoDoTrilho label="Criar servidor" onClick={() => setCreating(true)}>
          <Plus size={22} />
        </AcaoDoTrilho>

        {/*
          Some pra quem já está no app instalado: oferecer download a quem
          acabou de baixar é um botão pra lugar nenhum.
        */}
        {!ehDesktop() && (
          <AcaoDoTrilho label="Baixar o aplicativo" onClick={() => abrirConfiguracoes("aplicativo")}>
            <Download size={20} />
          </AcaoDoTrilho>
        )}
      </nav>

      <CreateGuildModal open={creating} onClose={() => setCreating(false)} onCreated={onSelect} />
    </>
  );
};

/*
  Os botões do trilho que NÃO são servidores.

  O círculo tracejado é o que separa as duas naturezas: servidor é um lugar que
  existe e tem cara própria (foto ou iniciais, quadrado arredondado, cheio);
  ação é um convite a criar algo que ainda não existe. Antes os dois eram o
  mesmo bloco cheio, e o "+" lia como mais um servidor da lista — só que verde.

  No hover ele se preenche e vira quadrado arredondado, igual aos servidores:
  é a mesma linguagem de "isto vai virar um lugar".
*/
const AcaoDoTrilho: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, onClick, children }) => (
  <Tooltip label={label} side="right">
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-12 items-center justify-center rounded-3xl border-2 border-dashed border-surface-4 text-ink-muted transition-all",
        "hover:rounded-2xl hover:border-solid hover:border-brand hover:bg-brand hover:text-white",
      )}
    >
      {children}
    </button>
  </Tooltip>
);
