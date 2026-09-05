import React, { useState } from "react";
import {
  CATEGORIAS_DE_COMUNIDADE,
  MEMBROS_PARA_DESCOBRIR,
  NOMES_DE_CATEGORIA,
  type CategoriaDeComunidade,
} from "@gravae/shared";

import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { Label } from "~/components/ui/input";
import { CampoSelect } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { UnsavedBar } from "~/components/ui/unsaved-bar";

const numero = new Intl.NumberFormat("pt-BR");

export const DescobertaSection: React.FC<{ guild: GuildModel }> = ({ guild }) => {
  const salvar = useUpdateGuild();

  const [descobrivel, setDescobrivel] = useState(guild.descobrivel !== false);
  const [categoria, setCategoria] = useState<string>(guild.categoria ?? "");

  const membros = guild.memberCount ?? 0;
  const faltam = Math.max(0, MEMBROS_PARA_DESCOBRIR - membros);
  const jaAparece = descobrivel && faltam === 0;

  const mudou =
    descobrivel !== (guild.descobrivel !== false) || categoria !== (guild.categoria ?? "");

  return (
    <div className="max-w-2xl pb-10">
      <h2 className="text-xl font-semibold">Explorar</h2>
      <p className="mt-1 text-sm text-ink-muted">
        A partir de {MEMBROS_PARA_DESCOBRIR} membros, o servidor passa a aparecer
        para quem procura comunidade no Explorar. Não é preciso pedir nada — mas
        dá para ficar de fora.
      </p>

      <div className="mt-6 rounded-lg border border-line bg-surface-2 p-4">
        <p className="text-sm font-medium">
          {jaAparece
            ? "Este servidor está aparecendo no Explorar"
            : !descobrivel
              ? "Este servidor está fora do Explorar"
              : `Faltam ${numero.format(faltam)} ${faltam === 1 ? "membro" : "membros"}`}
        </p>

        <p className="mt-1 text-xs text-ink-faint">
          {jaAparece
            ? `${numero.format(membros)} membros hoje. Quem entrar por aqui cai no seu canal de boas-vindas, como qualquer convite.`
            : !descobrivel
              ? "Só entra quem tiver um convite seu."
              : `${numero.format(membros)} de ${MEMBROS_PARA_DESCOBRIR}. Assim que passar, ele entra na lista sozinho.`}
        </p>
      </div>

      <div className="mt-6 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Aparecer no Explorar</p>
          <p className="mt-0.5 text-xs text-ink-faint">
            Desligado, o servidor fica de fora da lista mesmo passando dos{" "}
            {MEMBROS_PARA_DESCOBRIR} membros. Nada muda para quem já está dentro.
          </p>
        </div>

        <Switch checked={descobrivel} onCheckedChange={setDescobrivel} />
      </div>

      <div className="mt-6">
        <Label htmlFor="categoria-do-servidor">Categoria</Label>
        <CampoSelect
          id="categoria-do-servidor"
          valor={categoria}
          onEscolher={setCategoria}
          opcoes={[
            { valor: "", rotulo: "Sem categoria" },
            ...CATEGORIAS_DE_COMUNIDADE.map((id) => ({
              valor: id,
              rotulo: NOMES_DE_CATEGORIA[id],
            })),
          ]}
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          É a aba em que ele aparece. Sem categoria ele continua em "Todos", mas
          some quando alguém filtra.
        </p>
      </div>

      <UnsavedBar
        visivel={mudou}
        salvando={salvar.isPending}
        onDescartar={() => {
          setDescobrivel(guild.descobrivel !== false);
          setCategoria(guild.categoria ?? "");
        }}
        onSalvar={() =>
          salvar.mutate({
            guildId: guild.id,
            descobrivel,
            categoria: (categoria || null) as CategoriaDeComunidade | null,
          })
        }
      />
    </div>
  );
};
