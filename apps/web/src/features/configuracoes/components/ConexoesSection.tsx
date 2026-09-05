import React, { useState } from "react";
import { ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
import {
  comoSeLe,
  enderecoDaConexao,
  NOMES_DOS_SERVICOS,
  SERVICOS,
  type Conexao,
  type Servico,
} from "@gravae/shared";

import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { CampoSelect } from "~/components/ui/select";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";

const TETO = 8;

export const ConexoesSection: React.FC<{ user: SelfUserModel }> = ({
  user,
}) => {
  const salvar = useUpdateProfile();
  const conexoes = user.perfil?.conexoes ?? [];

  const [servico, setServico] = useState<Servico>("github");
  const [valor, setValor] = useState("");

  const gravar = (proximas: Conexao[]) =>
    salvar.mutate({ perfil: { ...user.perfil, conexoes: proximas } });

  const podeAdicionar =
    conexoes.length < TETO && enderecoDaConexao({ servico, valor }) !== null;

  const adicionar = () => {
    if (!podeAdicionar) return;

    gravar([...conexoes, { servico, valor: valor.trim().replace(/^@/, "") }]);
    setValor("");
  };

  return (
    <div data-gc="configuracoes.conexoes-section.div">
      <Secao data-gc="configuracoes.conexoes-section.secao"
        id="conexoes"
        titulo="Conexões"
        detalhe="As contas de fora que aparecem no seu perfil, para quem abrir ele."
      >
        <p data-gc="configuracoes.conexoes-section.p" className="mb-4 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
          Estas contas são{" "}
          <strong data-gc="configuracoes.conexoes-section.strong" className="text-ink">declaradas por você</strong>, e o Gravaê
          não confere nenhuma delas. Quem olhar o seu perfil vê o que você
          escreveu aqui — não uma prova de que a conta é sua.
        </p>

        {conexoes.length ? (
          <div data-gc="configuracoes.conexoes-section.div--2" className="mb-4 overflow-hidden rounded-lg border border-line">
            {conexoes.map((conexao, indice) => {
              const endereco = enderecoDaConexao(conexao);

              return (
                <div data-gc="configuracoes.conexoes-section.div--3"
                  key={`${conexao.servico}-${conexao.valor}-${indice}`}
                  className="flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0"
                >
                  <Link2 data-gc="configuracoes.conexoes-section.link2" size={16} className="shrink-0 text-ink-faint" />

                  <div data-gc="configuracoes.conexoes-section.div--4" className="min-w-0 flex-1">
                    <p data-gc="configuracoes.conexoes-section.p--2" className="truncate text-sm font-medium">
                      {NOMES_DOS_SERVICOS[conexao.servico]}
                    </p>
                    <p data-gc="configuracoes.conexoes-section.p--3" className="truncate text-xs text-ink-faint">
                      {comoSeLe(conexao)}
                    </p>
                  </div>

                  {endereco && (
                    <a data-gc="configuracoes.conexoes-section.a"
                      href={endereco}
                      target="_blank"
                      rel="noreferrer noopener"
                      title="Abrir"
                      aria-label={`Abrir ${NOMES_DOS_SERVICOS[conexao.servico]}`}
                      className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-ink"
                    >
                      <ExternalLink data-gc="configuracoes.conexoes-section.external-link" size={14} />
                    </a>
                  )}

                  <button data-gc="configuracoes.conexoes-section.button"
                    type="button"
                    onClick={() =>
                      gravar(conexoes.filter((_, i) => i !== indice))
                    }
                    disabled={salvar.isPending}
                    title="Remover"
                    aria-label={`Remover ${NOMES_DOS_SERVICOS[conexao.servico]}`}
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

        {conexoes.length >= TETO ? (
          <p data-gc="configuracoes.conexoes-section.p--5" className="text-xs text-ink-faint">
            Você chegou ao limite de {TETO}. Um perfil com vinte links deixa de
            ser perfil e vira lista de links — remova uma para adicionar outra.
          </p>
        ) : (
          <div data-gc="configuracoes.conexoes-section.div--5" className="flex items-end gap-2">
            <label data-gc="configuracoes.conexoes-section.label" className="w-44 shrink-0">
              <span data-gc="configuracoes.conexoes-section.span" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Onde
              </span>
              <CampoSelect data-gc="configuracoes.conexoes-section.campo-select.set-servico"
                valor={servico}
                onEscolher={setServico}
                opcoes={SERVICOS.map((s) => ({
                  valor: s,
                  rotulo: NOMES_DOS_SERVICOS[s],
                }))}
              />
            </label>

            <label data-gc="configuracoes.conexoes-section.label--2" className="min-w-0 flex-1">
              <span data-gc="configuracoes.conexoes-section.span--2" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {servico === "site" ? "Endereço" : "Nome de usuário"}
              </span>
              <Input data-gc="configuracoes.conexoes-section.input"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionar()}
                placeholder={servico === "site" ? "gravae.io" : "@voce"}
                aria-label={
                  servico === "site" ? "Endereço do site" : "Nome de usuário"
                }
              />
            </label>

            <Button data-gc="configuracoes.conexoes-section.button.adicionar"
              onClick={adicionar}
              disabled={!podeAdicionar || salvar.isPending}
            >
              <Plus data-gc="configuracoes.conexoes-section.plus" size={16} /> Adicionar
            </Button>
          </div>
        )}

        {valor.trim() && !enderecoDaConexao({ servico, valor }) && (
          <p data-gc="configuracoes.conexoes-section.p--6" className="mt-2 text-xs text-danger">
            {servico === "site"
              ? "Isso não parece um endereço de site. Precisa ter um domínio, e só http ou https."
              : "Nome de usuário só com letras, números, ponto, hífen e sublinhado."}
          </p>
        )}
      </Secao>
    </div>
  );
};
