import React, { useState } from "react";
import { Compass, TriangleAlert, X } from "lucide-react";
import {
  CATEGORY_NAMES,
  COMMUNITY_CATEGORIES,
  GUILD_TAGS_MAX,
  GUILD_TAG_LENGTH,
  MEMBERS_FOR_DISCOVER,
  type Channel,
  type CommunityCategory,
} from "@gravae/shared";

import { useMe } from "~/@core/application/queries/auth/use-me";
import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import { useVerifyGuild } from "~/@core/application/queries/guild/use-verificar-guild";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { Button, IconButton } from "~/components/ui/button";
import { BareInput, FieldGroup, Textarea } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";
import { CommunitySeal } from "~/features/servidor/components/SeloDaComunidade";
import { CommunitySection } from "~/features/servidor/components/server-settings/ComunidadeSection";
import {
  SettingsBlock,
  SettingsField,
  SettingsToggle,
} from "~/features/servidor/components/server-settings/SettingsBlocks";
import { cn } from "~/lib/utils";
import { LANGUAGES } from "~/traducao";

const DESCRIPTION_MAX = 300;

const number = new Intl.NumberFormat("pt-BR");

const sameTags = (a: string[], b: string[]) => a.length === b.length && a.every((tag, i) => tag === b[i]);

export const DiscoverySection: React.FC<{ guild: GuildModel; channels: Channel[] }> = ({ guild, channels }) => {
  const save = useUpdateGuild();
  const verify = useVerifyGuild();
  const admin = useMe(true).data?.admin === true;

  const [discoverable, setDiscoverable] = useState(guild.discoverable !== false);
  const [description, setDescription] = useState(guild.description ?? "");
  const [category, setCategory] = useState<string>(guild.category ?? "");
  const [language, setLanguage] = useState(guild.languagePrincipal ?? "");
  const [tags, setTags] = useState<string[]>(guild.tags ?? []);
  const [draftTag, setDraftTag] = useState("");

  const members = guild.memberCount ?? 0;
  const missing = Math.max(0, MEMBERS_FOR_DISCOVER - members);
  const progress = Math.min(100, Math.round((members / MEMBERS_FOR_DISCOVER) * 100));

  const changed =
    discoverable !== (guild.discoverable !== false) ||
    description !== (guild.description ?? "") ||
    category !== (guild.category ?? "") ||
    language !== (guild.languagePrincipal ?? "") ||
    !sameTags(tags, guild.tags ?? []);

  const addTag = () => {
    const tag = draftTag.trim().toLowerCase().slice(0, GUILD_TAG_LENGTH);
    setDraftTag("");
    if (!tag || tags.includes(tag) || tags.length >= GUILD_TAGS_MAX) return;
    setTags([...tags, tag]);
  };

  const apply = () =>
    save.mutate({
      guildId: guild.id,
      discoverable,
      description: description.trim() || null,
      category: (category || null) as CommunityCategory | null,
      languagePrincipal: language || null,
      tags,
    });

  return (
    <div data-gc="servidor.server-settings.descoberta-section.div" className="max-w-2xl space-y-8 pb-10">
      {missing > 0 ? (
        <div data-gc="servidor.server-settings.descoberta-section.div--2" className="rounded-xl border border-aviso/35 bg-aviso/8 px-4 py-3">
          <div data-gc="servidor.server-settings.descoberta-section.div--3" className="flex gap-3">
            <TriangleAlert data-gc="servidor.server-settings.descoberta-section.triangle-alert" size={18} className="mt-0.5 shrink-0 text-aviso" />
            <div data-gc="servidor.server-settings.descoberta-section.div--4" className="min-w-0 flex-1">
              <p data-gc="servidor.server-settings.descoberta-section.p" className="text-sm font-semibold text-aviso">Poucos membros</p>
              <p data-gc="servidor.server-settings.descoberta-section.p--2" className="mt-0.5 text-sm text-ink-muted">
                A comunidade entra no Explorar sozinha quando chegar a {MEMBERS_FOR_DISCOVER} membros. Hoje são{" "}
                {number.format(members)} — faltam {number.format(missing)}. Já dá para deixar a listagem pronta.
              </p>
              <div data-gc="servidor.server-settings.descoberta-section.div--5" className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div data-gc="servidor.server-settings.descoberta-section.div--6" className="h-full rounded-full bg-aviso" style={{ width: `${Math.max(progress, 2)}%` }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div data-gc="servidor.server-settings.descoberta-section.div--7"
          className={cn(
            "flex gap-3 rounded-xl border px-4 py-3",
            discoverable ? "border-online/30 bg-online/8" : "border-line-sutil bg-surface-2",
          )}
        >
          <Compass data-gc="servidor.server-settings.descoberta-section.compass" size={18} className={cn("mt-0.5 shrink-0", discoverable ? "text-online" : "text-ink-faint")} />
          <div data-gc="servidor.server-settings.descoberta-section.div--8" className="min-w-0">
            <p data-gc="servidor.server-settings.descoberta-section.p--3" className={cn("text-sm font-semibold", discoverable ? "text-online" : "text-ink")}>
              {discoverable ? "Aparecendo no Explorar" : "Fora do Explorar"}
            </p>
            <p data-gc="servidor.server-settings.descoberta-section.p--4" className="mt-0.5 text-sm text-ink-muted">
              {discoverable
                ? `${number.format(members)} membros. Quem entrar por lá cai no canal de boas-vindas, como qualquer convite.`
                : "Só entra quem tiver um convite."}
            </p>
          </div>
        </div>
      )}

      <SettingsBlock data-gc="servidor.server-settings.descoberta-section.settings-block"
        title="Listagem no Explorar"
        description="É o que as pessoas veem antes de entrar na comunidade."
      >
        <SettingsToggle data-gc="servidor.server-settings.descoberta-section.settings-toggle.set-discoverable"
          title="Aparecer no Explorar"
          description={`Desligado, a comunidade fica de fora da lista mesmo passando dos ${MEMBERS_FOR_DISCOVER} membros.`}
          checked={discoverable}
          onChange={setDiscoverable}
        />

        <SettingsField data-gc="servidor.server-settings.descoberta-section.settings-field" label="Descrição" htmlFor="descoberta-descricao">
          <Textarea data-gc="servidor.server-settings.descoberta-section.textarea"
            id="descoberta-descricao"
            value={description}
            maxLength={DESCRIPTION_MAX}
            rows={3}
            placeholder="Conte do que a comunidade trata, em poucas linhas."
            onChange={(e) => setDescription(e.target.value)}
          />
          <p data-gc="servidor.server-settings.descoberta-section.p--5" className="mt-1.5 text-right text-xs tabular-nums text-ink-faint">
            {description.length}/{DESCRIPTION_MAX}
          </p>
        </SettingsField>

        <div data-gc="servidor.server-settings.descoberta-section.div--9" className="grid gap-6 sm:grid-cols-2">
          <SettingsField data-gc="servidor.server-settings.descoberta-section.settings-field--2" label="Categoria" htmlFor="descoberta-categoria">
            <SelectField data-gc="servidor.server-settings.descoberta-section.select-field.set-category"
              id="descoberta-categoria"
              value={category}
              onSelect={setCategory}
              options={[
                { value: "", label: "Sem categoria" },
                ...COMMUNITY_CATEGORIES.map((id) => ({ value: id, label: CATEGORY_NAMES[id] })),
              ]}
            />
          </SettingsField>

          <SettingsField data-gc="servidor.server-settings.descoberta-section.settings-field--3" label="Idioma principal" htmlFor="descoberta-idioma">
            <SelectField data-gc="servidor.server-settings.descoberta-section.select-field.set-language"
              id="descoberta-idioma"
              value={language}
              onSelect={setLanguage}
              options={[
                { value: "", label: "Sem idioma" },
                ...LANGUAGES.map((item) => ({ value: item.lng, label: `${item.flag} ${item.native}` })),
              ]}
            />
          </SettingsField>
        </div>

        <SettingsField data-gc="servidor.server-settings.descoberta-section.settings-field--4"
          label="Tags personalizadas"
          htmlFor="descoberta-tags"
          hint={`Até ${GUILD_TAGS_MAX} tags. Ajudam a achar a comunidade na busca do Explorar.`}
        >
          <FieldGroup data-gc="servidor.server-settings.descoberta-section.field-group" className="h-auto min-h-10 flex-wrap py-1.5">
            {tags.map((tag) => (
              <span data-gc="servidor.server-settings.descoberta-section.span" key={tag} className="flex items-center gap-1 rounded-md bg-surface-3 py-0.5 pl-2 pr-1 text-xs font-medium">
                {tag}
                <IconButton data-gc="servidor.server-settings.descoberta-section.icon-button"
                  label={`Tirar a tag ${tag}`}
                  onClick={() => setTags(tags.filter((item) => item !== tag))}
                  size="xs"
                  className="size-4 rounded text-ink-faint [&_svg]:size-3"
                >
                  <X data-gc="servidor.server-settings.descoberta-section.x" />
                </IconButton>
              </span>
            ))}
            <BareInput data-gc="servidor.server-settings.descoberta-section.bare-input.add-tag"
              id="descoberta-tags"
              value={draftTag}
              maxLength={GUILD_TAG_LENGTH}
              disabled={tags.length >= GUILD_TAGS_MAX}
              placeholder={tags.length >= GUILD_TAGS_MAX ? "Limite de tags atingido" : "Digite e aperte Enter"}
              onChange={(e) => setDraftTag(e.target.value.replace(/,/g, ""))}
              onBlur={addTag}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                } else if (e.key === "Backspace" && !draftTag && tags.length) {
                  setTags(tags.slice(0, -1));
                }
              }}
              className="min-w-32"
            />
          </FieldGroup>
        </SettingsField>

        <div data-gc="servidor.server-settings.descoberta-section.div--10" className="flex justify-end gap-2">
          {changed && (
            <Button data-gc="servidor.server-settings.descoberta-section.button"
              variant="ghost"
              onClick={() => {
                setDiscoverable(guild.discoverable !== false);
                setDescription(guild.description ?? "");
                setCategory(guild.category ?? "");
                setLanguage(guild.languagePrincipal ?? "");
                setTags(guild.tags ?? []);
              }}
            >
              Descartar
            </Button>
          )}
          <Button data-gc="servidor.server-settings.descoberta-section.button.apply" disabled={!changed} loading={save.isPending} onClick={apply}>
            Aplicar
          </Button>
        </div>
      </SettingsBlock>

      {admin && (
        <SettingsBlock data-gc="servidor.server-settings.descoberta-section.settings-block--2" title="Selo de verificação">
          <SettingsToggle data-gc="servidor.server-settings.descoberta-section.settings-toggle"
            title="Comunidade verificada"
            description={
              <span data-gc="servidor.server-settings.descoberta-section.span--2" className="flex items-center gap-1.5">
                <CommunitySeal data-gc="servidor.server-settings.descoberta-section.community-seal" verified withoutHint />
                Só a administração do app vê este interruptor.
              </span>
            }
            checked={guild.verified === true}
            disabled={verify.isPending}
            onChange={(value) => verify.mutate({ guildId: guild.id, verified: value })}
          />
        </SettingsBlock>
      )}

      <SettingsBlock data-gc="servidor.server-settings.descoberta-section.settings-block--3"
        title="Recursos de comunidade"
        description="Canais de regras e avisos, e as travas de segurança para quem chega."
      >
        <CommunitySection data-gc="servidor.server-settings.descoberta-section.community-section" guildId={guild.id} channels={channels} embedded />
      </SettingsBlock>
    </div>
  );
};
