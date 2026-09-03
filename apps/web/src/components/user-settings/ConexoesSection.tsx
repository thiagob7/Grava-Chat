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
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";

/// O mesmo teto do schema. Repetido aqui de propósito: a tela precisa avisar
/// ANTES de o servidor recusar, e o número é a coisa que ela precisa saber.
const TETO = 8;

/**
 * As contas de fora que aparecem no meu perfil.
 *
 * Elas são DECLARADAS, não verificadas — e a tela diz isso com todas as
 * letras. No Discord a conexão passa por OAuth com o serviço e por isso vale
 * como prova; aqui não passa por nada. Deixar essa diferença implícita seria
 * emprestar credibilidade que não existe: alguém confiaria num "@" que pode
 * não ser de quem diz ser.
 */
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
    <div>
      <Secao
        id="conexoes"
        titulo="Conexões"
        detalhe="As contas de fora que aparecem no seu perfil, para quem abrir ele."
      >
        {/*
          O aviso vem antes da lista, e não em letra miúda no rodapé: ele muda
          o que a lista SIGNIFICA para quem a lê, e quem chega aqui para
          adicionar a primeira precisa saber disso antes de decidir.
        */}
        <p className="mb-4 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
          Estas contas são{" "}
          <strong className="text-ink">declaradas por você</strong>, e o Gravaê
          não confere nenhuma delas. Quem olhar o seu perfil vê o que você
          escreveu aqui — não uma prova de que a conta é sua.
        </p>

        {conexoes.length ? (
          <div className="mb-4 overflow-hidden rounded-lg border border-line">
            {conexoes.map((conexao, indice) => {
              const endereco = enderecoDaConexao(conexao);

              return (
                <div
                  key={`${conexao.servico}-${conexao.valor}-${indice}`}
                  className="flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0"
                >
                  <Link2 size={16} className="shrink-0 text-ink-faint" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {NOMES_DOS_SERVICOS[conexao.servico]}
                    </p>
                    <p className="truncate text-xs text-ink-faint">
                      {comoSeLe(conexao)}
                    </p>
                  </div>

                  {endereco && (
                    <a
                      href={endereco}
                      target="_blank"
                      rel="noreferrer noopener"
                      title="Abrir"
                      aria-label={`Abrir ${NOMES_DOS_SERVICOS[conexao.servico]}`}
                      className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-ink"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      gravar(conexoes.filter((_, i) => i !== indice))
                    }
                    disabled={salvar.isPending}
                    title="Remover"
                    aria-label={`Remover ${NOMES_DOS_SERVICOS[conexao.servico]}`}
                    className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-danger disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mb-4 text-sm text-ink-faint">
            Você não adicionou nenhuma conta.
          </p>
        )}

        {conexoes.length >= TETO ? (
          <p className="text-xs text-ink-faint">
            Você chegou ao limite de {TETO}. Um perfil com vinte links deixa de
            ser perfil e vira lista de links — remova uma para adicionar outra.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <label className="w-44 shrink-0">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Onde
              </span>
              <CampoSelect
                valor={servico}
                onEscolher={setServico}
                opcoes={SERVICOS.map((s) => ({
                  valor: s,
                  rotulo: NOMES_DOS_SERVICOS[s],
                }))}
              />
            </label>

            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {servico === "site" ? "Endereço" : "Nome de usuário"}
              </span>
              <Input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionar()}
                placeholder={servico === "site" ? "gravae.io" : "@voce"}
                aria-label={
                  servico === "site" ? "Endereço do site" : "Nome de usuário"
                }
              />
            </label>

            <Button
              onClick={adicionar}
              disabled={!podeAdicionar || salvar.isPending}
            >
              <Plus size={16} /> Adicionar
            </Button>
          </div>
        )}

        {/*
          O erro aparece só depois que a pessoa escreveu alguma coisa: um aviso
          vermelho num campo que ela ainda nem tocou é o app reclamando antes
          de haver do que reclamar.
        */}
        {valor.trim() && !enderecoDaConexao({ servico, valor }) && (
          <p className="mt-2 text-xs text-danger">
            {servico === "site"
              ? "Isso não parece um endereço de site. Precisa ter um domínio, e só http ou https."
              : "Nome de usuário só com letras, números, ponto, hífen e sublinhado."}
          </p>
        )}
      </Secao>
    </div>
  );
};
