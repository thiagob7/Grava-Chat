import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { useCreateGuild } from "~/@core/application/queries/guild/use-create-guild";
import { useCreateChannel } from "~/@core/application/queries/guild/use-create-channel";
import { apiErrorMessage } from "~/@core/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { codigoDoConvite, MOLDES, type MoldeDeServidor } from "~/lib/moldes-de-servidor";

/**
 * O que a pessoa vê no lugar do vazio, quando ainda não tem servidor nenhum.
 *
 * Antes havia só uma frase — "Você ainda não tem servidores" — e uma seta
 * apontando pro `+` da barra. Isso descreve o problema sem oferecer a saída, e
 * quem acabou de criar a conta é exatamente quem menos sabe o que fazer com um
 * botão de mais.
 *
 * Aqui as duas saídas reais ficam à vista: criar o seu, ou entrar no de alguém
 * com um convite. Os moldes existem pra terceira situação, a mais comum de
 * todas — querer criar e não saber que canais fazem sentido.
 */
export const PrimeiroServidor: React.FC = () => {
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

      /*
        Os canais do molde vão um a um, e em sequência — não em paralelo. A
        posição de cada canal sai do último criado, e disparar tudo junto faria
        a ordem virar sorteio.

        Se um falhar, o servidor já existe e a pessoa entra nele: melhor um
        canal faltando, que ela cria em dois cliques, do que uma tela de erro
        depois de o servidor ter sido criado de verdade.
      */
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
    <div className="flex flex-1 items-center justify-center overflow-y-auto bg-surface-2 p-6">
      <div className="w-full max-w-md py-8">
        <h2 className="text-2xl font-bold">Crie seu primeiro servidor</h2>
        <p className="mt-1 text-ink-muted">
          Um servidor é onde você e seus amigos se encontram. Crie o seu e chame a galera.
        </p>

        <div className="mt-6 space-y-2">
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
                /*
                  O molde preenche o nome sugerido em vez de criar na hora. Criar
                  direto tiraria da pessoa a única decisão que ela realmente quer
                  tomar aqui — como o servidor dela vai se chamar.
                */
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
      </div>
    </div>
  );
};

const cnMolde = (escolhido: boolean) =>
  [
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
    escolhido
      ? "bg-surface-4 ring-1 ring-brand"
      : "bg-surface-1 hover:bg-surface-3 disabled:opacity-60",
  ].join(" ");
