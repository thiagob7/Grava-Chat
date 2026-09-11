import React, { useState } from "react";
import {
  COMMUNITY_CATEGORIES,
  MEMBERS_FOR_DISCOVER,
  CATEGORY_NAMES,
  type CommunityCategory,
} from "@gravae/shared";

import { useMe } from "~/@core/application/queries/auth/use-me";
import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import { useVerifyGuild } from "~/@core/application/queries/guild/use-verificar-guild";
import { CommunitySeal } from "~/features/servidor/components/SeloDaComunidade";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { Label } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { UnsavedBar } from "~/components/ui/unsaved-bar";

const number = new Intl.NumberFormat("pt-BR");

export const DiscoverySection: React.FC<{ guild: GuildModel }> = ({ guild }) => {
  const save = useUpdateGuild();
  const verify = useVerifyGuild();
  const admin = useMe(true).data?.admin === true;

  const [discoverable, setDiscoverable] = useState(guild.discoverable !== false);
  const [category, setCategory] = useState<string>(guild.category ?? "");

  const members = guild.memberCount ?? 0;
  const missing = Math.max(0, MEMBERS_FOR_DISCOVER - members);
  const alreadyAppears = discoverable && missing === 0;

  const changed =
    discoverable !== (guild.discoverable !== false) || category !== (guild.category ?? "");

  return (
    <div data-gc="servidor.server-settings.descoberta-section.div" className="max-w-2xl pb-10">
      <h2 data-gc="servidor.server-settings.descoberta-section.h2" className="text-xl font-semibold">Explorar</h2>
      <p data-gc="servidor.server-settings.descoberta-section.p" className="mt-1 text-sm text-ink-muted">
        A partir de {MEMBERS_FOR_DISCOVER} membros, o servidor passa a aparecer
        para quem procura comunidade no Explorar. Não é preciso pedir nada — mas
        dá para ficar de fora.
      </p>

      <div data-gc="servidor.server-settings.descoberta-section.div--2" className="mt-6 rounded-lg border border-line bg-surface-2 p-4">
        <p data-gc="servidor.server-settings.descoberta-section.p--2" className="text-sm font-medium">
          {alreadyAppears
            ? "Este servidor está aparecendo no Explorar"
            : !discoverable
              ? "Este servidor está fora do Explorar"
              : `Faltam ${number.format(missing)} ${missing === 1 ? "membro" : "membros"}`}
        </p>

        <p data-gc="servidor.server-settings.descoberta-section.p--3" className="mt-1 text-xs text-ink-faint">
          {alreadyAppears
            ? `${number.format(members)} membros hoje. Quem entrar por aqui cai no seu canal de boas-vindas, como qualquer convite.`
            : !discoverable
              ? "Só entra quem tiver um convite seu."
              : `${number.format(members)} de ${MEMBERS_FOR_DISCOVER}. Assim que passar, ele entra na lista sozinho.`}
        </p>
      </div>

      <div data-gc="servidor.server-settings.descoberta-section.div--3" className="mt-6 flex items-start gap-4">
        <div data-gc="servidor.server-settings.descoberta-section.div--4" className="min-w-0 flex-1">
          <p data-gc="servidor.server-settings.descoberta-section.p--4" className="text-sm font-medium">Aparecer no Explorar</p>
          <p data-gc="servidor.server-settings.descoberta-section.p--5" className="mt-0.5 text-xs text-ink-faint">
            Desligado, o servidor fica de fora da lista mesmo passando dos{" "}
            {MEMBERS_FOR_DISCOVER} membros. Nada muda para quem já está dentro.
          </p>
        </div>

        <Switch data-gc="servidor.server-settings.descoberta-section.switch.set-discoverable" checked={discoverable} onCheckedChange={setDiscoverable} />
      </div>

      {admin && (
        <div data-gc="servidor.server-settings.descoberta-section.div--5" className="mt-6 flex items-start gap-4 rounded-lg border border-brand/40 bg-brand/5 p-4">
          <div data-gc="servidor.server-settings.descoberta-section.div--6" className="min-w-0 flex-1">
            <p data-gc="servidor.server-settings.descoberta-section.p--6" className="flex items-center gap-1.5 text-sm font-medium">
              <CommunitySeal data-gc="servidor.server-settings.descoberta-section.community-seal" verified withoutHint />
              Comunidade verificada
            </p>
            <p data-gc="servidor.server-settings.descoberta-section.p--7" className="mt-0.5 text-xs text-ink-faint">
              Só a administração do app vê este interruptor. O selo aparece ao lado do nome do servidor em todo lugar.
            </p>
          </div>

          <Switch data-gc="servidor.server-settings.descoberta-section.switch"
            checked={guild.verified === true}
            disabled={verify.isPending}
            onCheckedChange={(value) => verify.mutate({ guildId: guild.id, verified: value })}
          />
        </div>
      )}

      <div data-gc="servidor.server-settings.descoberta-section.div--7" className="mt-6">
        <Label data-gc="servidor.server-settings.descoberta-section.label" htmlFor="categoria-do-servidor">Categoria</Label>
        <SelectField data-gc="servidor.server-settings.descoberta-section.select-field.set-category"
          id="categoria-do-servidor"
          value={category}
          onSelect={setCategory}
          options={[
            { value: "", label: "Sem categoria" },
            ...COMMUNITY_CATEGORIES.map((id) => ({
              value: id,
              label: CATEGORY_NAMES[id],
            })),
          ]}
        />
        <p data-gc="servidor.server-settings.descoberta-section.p--8" className="mt-1.5 text-xs text-ink-faint">
          É a aba em que ele aparece. Sem categoria ele continua em "Todos", mas
          some quando alguém filtra.
        </p>
      </div>

      <UnsavedBar data-gc="servidor.server-settings.descoberta-section.unsaved-bar"
        visible={changed}
        saving={save.isPending}
        onDiscard={() => {
          setDiscoverable(guild.discoverable !== false);
          setCategory(guild.category ?? "");
        }}
        onSave={() =>
          save.mutate({
            guildId: guild.id,
            discoverable,
            category: (category || null) as CommunityCategory | null,
          })
        }
      />
    </div>
  );
};
