import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Bot, Check, ShieldAlert } from "lucide-react";

import type { DestinosDoBotModel } from "~/@core/application/requests/bot/bots";

import {
  useAddBotToGuild,
  useBotDestinations,
  useBotInvite,
} from "~/@core/application/queries/bot/use-bots";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { CampoSelect } from "~/components/ui/select";
import { Label } from "~/components/ui/input";
import { PERMISSION_LABELS } from "@gravae/shared";

export const AdicionarBot: React.FC = () => {
  const { botId } = useParams<{ botId: string }>();
  const navigate = useNavigate();

  const convite = useBotInvite(botId);
  const onde = useBotDestinations(botId);
  const adicionar = useAddBotToGuild();

  const [escolhido, setEscolhido] = useState("");

  const disponiveis = onde.data?.destinos ?? [];

  if (convite.isLoading) {
    return <Moldura data-gc="bot.adicionar-bot.moldura"><p data-gc="bot.adicionar-bot.p" className="text-sm text-ink-faint">Carregando…</p></Moldura>;
  }

  if (convite.isError || !convite.data) {
    return (
      <Moldura data-gc="bot.adicionar-bot.moldura--2">
        <ShieldAlert data-gc="bot.adicionar-bot.shield-alert" size={40} className="mx-auto text-ink-faint" />
        <h1 data-gc="bot.adicionar-bot.h1" className="mt-4 text-xl font-semibold">Esse convite não vale</h1>
        <p data-gc="bot.adicionar-bot.p--2" className="mt-2 text-sm text-ink-muted">
          O bot pode ter sido apagado, ou o link veio errado.
        </p>
        <Button data-gc="bot.adicionar-bot.button" className="mt-6 w-full" onClick={() => navigate("/channels")}>
          Voltar
        </Button>
      </Moldura>
    );
  }

  const bot = convite.data;

  return (
    <Moldura data-gc="bot.adicionar-bot.moldura--3">
      <div data-gc="bot.adicionar-bot.div" className="flex flex-col items-center">
        <Avatar data-gc="bot.adicionar-bot.avatar" id={bot.usuario.id} name={bot.usuario.displayName} url={bot.usuario.avatarUrl} size={80} />

        <h1 data-gc="bot.adicionar-bot.h1--2" className="mt-4 flex items-center gap-2 text-xl font-semibold">
          {bot.usuario.displayName}
          <span data-gc="bot.adicionar-bot.span" className="rounded bg-brand px-1.5 py-0.5 text-10 font-bold uppercase text-white">
            app
          </span>
        </h1>

        <p data-gc="bot.adicionar-bot.p--3" className="text-sm text-ink-faint">@{bot.usuario.username}</p>

        {bot.descricao && (
          <p data-gc="bot.adicionar-bot.p--4" className="mt-3 text-center text-sm text-ink-muted">{bot.descricao}</p>
        )}
      </div>

      <div data-gc="bot.adicionar-bot.div--2" className="mt-6">
        <Label data-gc="bot.adicionar-bot.label" htmlFor="servidor">Adicionar em</Label>

        {disponiveis.length ? (
          <CampoSelect data-gc="bot.adicionar-bot.campo-select.set-escolhido"
            id="servidor"
            valor={escolhido}
            onEscolher={setEscolhido}
            placeholder="Escolha o servidor"
            opcoes={disponiveis.map((g) => ({ valor: g.id, rotulo: g.name }))}
          />
        ) : (
          <p data-gc="bot.adicionar-bot.p--5" className="rounded bg-surface-0 px-3 py-2 text-sm text-ink-faint">
            <SemDestino data-gc="bot.adicionar-bot.sem-destino" onde={onde.data} />
          </p>
        )}

        <p data-gc="bot.adicionar-bot.p--6" className="mt-1.5 text-xs text-ink-faint">
          Só aparecem os servidores onde você pode gerenciar.
        </p>
      </div>

      <div data-gc="bot.adicionar-bot.div--3" className="mt-5">
        <p data-gc="bot.adicionar-bot.p--7" className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Esse bot está pedindo
        </p>

        {bot.permissoesPedidas.length ? (
          <ul data-gc="bot.adicionar-bot.ul" className="space-y-1.5 rounded bg-surface-0 p-3">
            {bot.permissoesPedidas.map((p) => (
              <li data-gc="bot.adicionar-bot.li" key={p} className="flex items-center gap-2 text-sm text-ink-muted">
                <Check data-gc="bot.adicionar-bot.check" size={14} className="shrink-0 text-online" />
                {PERMISSION_LABELS[p]?.nome ?? p}
              </li>
            ))}
          </ul>
        ) : (
          <p data-gc="bot.adicionar-bot.p--8" className="rounded bg-surface-0 px-3 py-2 text-sm text-ink-faint">
            Nada além do que todo mundo já pode.
          </p>
        )}

        <p data-gc="bot.adicionar-bot.p--9" className="mt-2 text-xs text-ink-faint">
          Ele entra com um cargo próprio. Dá para mexer nessas permissões depois em
          Configurações do servidor → Cargos.
        </p>
      </div>

      <div data-gc="bot.adicionar-bot.div--4" className="mt-6 flex gap-2">
        <Button data-gc="bot.adicionar-bot.button--2" variant="surface" className="flex-1" onClick={() => navigate("/channels")}>
          Cancelar
        </Button>

        <Button data-gc="bot.adicionar-bot.button--3"
          className="flex-1"
          disabled={!escolhido || adicionar.isPending}
          onClick={() =>
            adicionar.mutate(
              { botId: bot.id, guildId: escolhido },
              { onSuccess: () => navigate(`/channels/${escolhido}`) },
            )
          }
        >
          <Bot data-gc="bot.adicionar-bot.bot" size={16} /> Autorizar
        </Button>
      </div>
    </Moldura>
  );
};

const SemDestino: React.FC<{ onde?: DestinosDoBotModel }> = ({ onde }) => {
  if (!onde) return <>Carregando…</>;

  if (!onde.totalDeServidores) return <>Você ainda não está em nenhum servidor.</>;

  if (onde.jaEstaEm >= onde.totalDeServidores) {
    return <>Esse bot já está em todos os servidores que você gerencia.</>;
  }

  return (
    <>
      Você não gerencia nenhum servidor onde esse bot ainda não esteja. Só quem tem
      “Gerenciar servidor” pode adicionar um bot.
    </>
  );
};

const Moldura: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main data-gc="bot.adicionar-bot.main" className="flex min-h-dvh items-center justify-center bg-surface-0 p-4">
    <div data-gc="bot.adicionar-bot.div--5" className="w-full max-w-md rounded-lg bg-surface-1 p-6 shadow-2xl">{children}</div>
  </main>
);
