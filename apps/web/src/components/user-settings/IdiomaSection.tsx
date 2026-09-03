import React, { useMemo, useState } from "react";

import { CampoSelect } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { IDIOMAS, idiomaAtual, trocarIdioma, useTranslation } from "~/traducao";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";
import { useAparencia } from "~/stores/aparencia";

export const IdiomaSection: React.FC = () => {
  const prefs = useAparencia();
  const { t } = useTranslation();

  /*
    Os exemplos saem do relógio, e nos DOIS formatos ao mesmo tempo.

    "14:30" e "2:30 PM" explicam a diferença, mas uma hora que não é a sua faz
    a pessoa conferir duas vezes se entendeu. Com a hora de agora, o exemplo é
    verificável de relance — basta olhar o relógio do sistema.

    `useMemo` sem dependência de propósito: a hora é lida uma vez por abertura.
    Sem ele, cada renderização traria um minuto novo, e o exemplo mudaria
    embaixo do dedo de quem está escolhendo.
  */
  const exemplos = useMemo(() => {
    const agora = new Date();

    return {
      "idioma.formatoDaHora.vinteQuatro": agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      "idioma.formatoDaHora.dozeHoras": agora.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    } as Record<string, string>;
  }, []);

  const FORMATOS = FORMATOS_BASE.map((formato) => ({
    ...formato,
    exemplo: exemplos[formato.chave] ?? "",
  }));

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Secao
        id="idioma-da-interface"
        titulo={t("idioma.titulo")}
        detalhe={t("idioma.detalhe")}
      >
        <EscolherIdioma />
      </Secao>

      <Secao
        id="formato-da-hora"
        titulo={t("idioma.formatoDaHora.titulo")}
        detalhe={t("idioma.formatoDaHora.detalhe")}
      >
        {/*
          Rádio com o EXEMPLO embaixo de cada opção, e não uma caixa de
          seleção com dois rótulos.

          "24 horas" e "12 horas" explicam a diferença para quem já sabe qual
          quer. Quem não sabe precisa VER — e ver "14:30" contra "2:30 PM"
          decide num relance o que dois rótulos não decidem. A referência faz
          assim pelo mesmo motivo.
        */}
        <div
          role="radiogroup"
          aria-label={t("idioma.formatoDaHora.titulo")}
          className="space-y-2"
        >
          {FORMATOS.map((formato) => {
            const escolhido = prefs.horaEm24h === formato.vinteQuatro;

            return (
              <button
                key={formato.chave}
                type="button"
                role="radio"
                aria-checked={escolhido}
                onClick={() =>
                  prefs.definir({ horaEm24h: formato.vinteQuatro })
                }
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
                  escolhido
                    ? "border-brand bg-brand/5"
                    : "border-line hover:bg-surface-3",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "relative mt-0.5 size-4 shrink-0 rounded-full border transition",
                    escolhido ? "border-brand" : "border-surface-4",
                  )}
                >
                  {escolhido && (
                    <span className="absolute inset-[3px] rounded-full bg-brand" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {t(formato.chave)}
                  </span>
                  {/*
                    O exemplo é a hora de AGORA no formato da opção, e não uma
                    hora inventada: uma hora que não é a sua faz a pessoa
                    conferir duas vezes se entendeu. Com a hora atual, basta
                    olhar o relógio.
                  */}
                  <span className="mt-0.5 block font-mono text-xs text-ink-faint">
                    {formato.exemplo}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Secao>
    </div>
  );
};

/*
  As duas formas de escrever a hora, com o exemplo tirado do relógio.

  Ficam fora do componente porque o exemplo depende de `agora`, que é lido a
  cada renderização — a lista é montada dentro, e só a forma mora aqui.
*/
const FORMATOS_BASE = [
  { chave: "idioma.formatoDaHora.vinteQuatro", vinteQuatro: true },
  { chave: "idioma.formatoDaHora.dozeHoras", vinteQuatro: false },
] as const;

/**
 * A escolha do idioma, no formato da referência: uma caixa de seleção.
 *
 * Era uma lista aberta com trinta e quatro linhas, e trinta e quatro linhas
 * empurravam o "Formato da hora" para fora da tela — a tela de Idioma virava a
 * tela de escolher idioma. Fechada, ela ocupa uma linha e abre com tudo.
 *
 * Cada opção traz o nome NATIVO à esquerda e o nome traduzido com a bandeira à
 * direita, como na referência. O nativo é o que a pessoa procura: "Español"
 * acha quem fala espanhol, "Espanhol" acha quem já lê português — e quem já lê
 * português não precisa desta tela.
 */
const EscolherIdioma: React.FC = () => {
  const { t } = useTranslation();
  const [atual, setAtual] = useState(idiomaAtual);

  return (
    <div>
      {/*
        O aviso vem antes: quem troca o idioma e encontra metade da tela em
        português conclui que o app está quebrado. Dizer antes transforma um
        bug aparente numa expectativa correta.
      */}
      <p className="mb-3 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
        {t("idioma.emAndamento")}
      </p>

      <CampoSelect
        valor={atual}
        onEscolher={(lng) => {
          setAtual(lng);
          void trocarIdioma(lng);
        }}
        opcoes={IDIOMAS.map((idioma) => ({
          valor: idioma.lng,
          rotulo: (
            <span className="flex w-full min-w-0 items-center gap-3">
              <span className="min-w-0 flex-1 truncate">{idioma.nativo}</span>
              <span className="shrink-0 text-ink-faint">{idioma.nome}</span>
              <span aria-hidden className="shrink-0 text-base leading-none">
                {idioma.bandeira}
              </span>
            </span>
          ),
        }))}
      />
    </div>
  );
};
