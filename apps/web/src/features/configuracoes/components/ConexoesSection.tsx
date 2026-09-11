import React, { useState } from "react";
import { ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
import {
  asLe,
  connectionAddress,
  SERVICES_NAMES,
  SERVICES,
  type Connection,
  type Service,
} from "@gravae/shared";

import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";

const CEILING = 8;

export const ConnectionsSection: React.FC<{ user: SelfUserModel }> = ({
  user,
}) => {
  const save = useUpdateProfile();
  const connections = user.profile?.connections ?? [];

  const [service, setService] = useState<Service>("github");
  const [value, setValue] = useState("");

  const record = (next: Connection[]) =>
    save.mutate({ profile: { ...user.profile, connections: next } });

  const canAdd =
    connections.length < CEILING && connectionAddress({ service, value }) !== null;

  const add = () => {
    if (!canAdd) return;

    record([...connections, { service, value: value.trim().replace(/^@/, "") }]);
    setValue("");
  };

  return (
    <div data-gc="configuracoes.conexoes-section.div">
      <Section data-gc="configuracoes.conexoes-section.section"
        id="connections"
        title="Conexões"
        detail="As contas de fora que aparecem no seu perfil, para quem abrir ele."
      >
        <p data-gc="configuracoes.conexoes-section.p" className="mb-4 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
          Estas contas são{" "}
          <strong data-gc="configuracoes.conexoes-section.strong" className="text-ink">declaradas por você</strong>, e o Gravaê
          não confere nenhuma delas. Quem olhar o seu perfil vê o que você
          escreveu aqui — não uma prova de que a conta é sua.
        </p>

        {connections.length ? (
          <div data-gc="configuracoes.conexoes-section.div--2" className="mb-4 overflow-hidden rounded-lg border border-line">
            {connections.map((connection, index) => {
              const address = connectionAddress(connection);

              return (
                <div data-gc="configuracoes.conexoes-section.div--3"
                  key={`${connection.service}-${connection.value}-${index}`}
                  className="flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0"
                >
                  <Link2 data-gc="configuracoes.conexoes-section.link2" size={16} className="shrink-0 text-ink-faint" />

                  <div data-gc="configuracoes.conexoes-section.div--4" className="min-w-0 flex-1">
                    <p data-gc="configuracoes.conexoes-section.p--2" className="truncate text-sm font-medium">
                      {SERVICES_NAMES[connection.service]}
                    </p>
                    <p data-gc="configuracoes.conexoes-section.p--3" className="truncate text-xs text-ink-faint">
                      {asLe(connection)}
                    </p>
                  </div>

                  {address && (
                    <a data-gc="configuracoes.conexoes-section.a"
                      href={address}
                      target="_blank"
                      rel="noreferrer noopener"
                      title="Abrir"
                      aria-label={`Abrir ${SERVICES_NAMES[connection.service]}`}
                      className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-ink"
                    >
                      <ExternalLink data-gc="configuracoes.conexoes-section.external-link" size={14} />
                    </a>
                  )}

                  <button data-gc="configuracoes.conexoes-section.button"
                    type="button"
                    onClick={() =>
                      record(connections.filter((_, i) => i !== index))
                    }
                    disabled={save.isPending}
                    title="Remover"
                    aria-label={`Remover ${SERVICES_NAMES[connection.service]}`}
                    className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-danger disabled:opacity-40"
                  >
                    <Trash2 data-gc="configuracoes.conexoes-section.trash2" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p data-gc="configuracoes.conexoes-section.p--4" className="mb-4 text-sm text-ink-faint">
            Você não adicionou nenhuma conta.
          </p>
        )}

        {connections.length >= CEILING ? (
          <p data-gc="configuracoes.conexoes-section.p--5" className="text-xs text-ink-faint">
            Você chegou ao limite de {CEILING}. Um perfil com vinte links deixa de
            ser perfil e vira lista de links — remova uma para adicionar outra.
          </p>
        ) : (
          <div data-gc="configuracoes.conexoes-section.div--5" className="flex items-end gap-2">
            <label data-gc="configuracoes.conexoes-section.label" className="w-44 shrink-0">
              <span data-gc="configuracoes.conexoes-section.span" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Onde
              </span>
              <SelectField data-gc="configuracoes.conexoes-section.select-field.set-service"
                value={service}
                onSelect={setService}
                options={SERVICES.map((s) => ({
                  value: s,
                  label: SERVICES_NAMES[s],
                }))}
              />
            </label>

            <label data-gc="configuracoes.conexoes-section.label--2" className="min-w-0 flex-1">
              <span data-gc="configuracoes.conexoes-section.span--2" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {service === "site" ? "Endereço" : "Nome de usuário"}
              </span>
              <Input data-gc="configuracoes.conexoes-section.input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder={service === "site" ? "seusite.com" : "@voce"}
                aria-label={
                  service === "site" ? "Endereço do site" : "Nome de usuário"
                }
              />
            </label>

            <Button data-gc="configuracoes.conexoes-section.button.add"
              onClick={add}
              disabled={!canAdd || save.isPending}
            >
              <Plus data-gc="configuracoes.conexoes-section.plus" size={16} /> Adicionar
            </Button>
          </div>
        )}

        {value.trim() && !connectionAddress({ service, value }) && (
          <p data-gc="configuracoes.conexoes-section.p--6" className="mt-2 text-xs text-danger">
            {service === "site"
              ? "Isso não parece um endereço de site. Precisa ter um domínio, e só http ou https."
              : "Nome de usuário só com letras, números, ponto, hífen e sublinhado."}
          </p>
        )}
      </Section>
    </div>
  );
};
