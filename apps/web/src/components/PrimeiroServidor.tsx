import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { useCreateGuild } from "~/@core/application/queries/guild/use-create-guild";
import { useCreateChannel } from "~/@core/application/queries/guild/use-create-channel";
import { apiErrorMessage } from "~/@core/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { codigoDoConvite, MOLDES, type MoldeDeServidor } from "~/lib/moldes-de-servidor";

export const PrimeiroServidor: React.FC<{ aberto: boolean; onFechar: () => void }> = ({
  aberto,
  onFechar,
}) => {
  const navigate = useNavigate();
  const criarServidor = useCreateGuild();
  const criarCanal = useCreateChannel();

  const [nome, setNome] = useState("");
  const [convite, setConvite] = useState("");
  const [molde, setMolde] = useState<MoldeDeServidor | null>(null);
  const [criando, setCriando] = useState(false);

  const criar = async (comMolde: MoldeDeServidor | null, nomeEscolhido: string) => {
    const limpo = nomeEscolhido.trim();
    if (!limpo || criando) return;

    setCriando(true);

    try {
      const guild = await criarServidor.mutateAsync({ name: limpo });

      for (const canal of comMolde?.canais ?? []) {
        await criarCanal
          .mutateAsync({ guildId: guild.id, name: canal.nome, type: canal.tipo })
          .catch(() => undefined);
      }

      navigate(`/channels/${guild.id}`);
    } catch (erro) {
      toast.error(apiErrorMessage(erro, "Não consegui criar o servidor."));
      setCriando(false);
    }
  };

  const entrar = () => {
    const codigo = codigoDoConvite(convite);
    if (!codigo) return;

    navigate(`/invite/${codigo}`);
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crie seu primeiro servidor</DialogTitle>
          <DialogDescription>
            Um servidor é onde você e seus amigos se encontram. Crie o seu e
            chame a galera.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Criar o meu
          </label>

          <div className="flex gap-2">
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void criar(molde, nome)}
              placeholder={molde ? molde.sugestaoDeNome : "Nome do servidor"}
              maxLength={64}
            />
            <Button onClick={() => void criar(molde, nome)} disabled={!nome.trim() || criando}>
              {criando ? <Loader2 size={16} className="animate-spin" /> : "Criar"}
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Começar de um molde
          </p>

          <div className="space-y-2">
            {MOLDES.map((m) => (
              <button
                key={m.id}
                disabled={criando}
                onClick={() => {
                  setMolde(m);
                  setNome((atual) => atual || m.sugestaoDeNome);
                }}
                className={cnMolde(molde?.id === m.id)}
              >
                <span className="text-xl">{m.emoji}</span>

                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-medium">{m.nome}</span>
                  <span className="block truncate text-xs text-ink-faint">
                    {m.canais.map((c) => c.nome).join(" · ")}
                  </span>
                </span>

                <ChevronRight size={16} className="shrink-0 text-ink-faint" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-divisor pt-6">
          <p className="mb-2 text-sm font-medium">Já tem um convite?</p>

          <div className="flex gap-2">
            <Input
              value={convite}
              onChange={(e) => setConvite(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && entrar()}
              placeholder="Cole o link ou o código do convite"
            />
            <Button variant="surface" onClick={entrar} disabled={!codigoDoConvite(convite)}>
              Entrar
            </Button>
          </div>
        </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

const cnMolde = (escolhido: boolean) =>
  [
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
    escolhido
      ? "bg-surface-4 ring-1 ring-brand"
      : "bg-surface-1 hover:bg-surface-3 disabled:opacity-60",
  ].join(" ");
