import React, { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { CampoSelect } from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import {
  IDIOMAS,
  idiomaAtual,
  trocarIdioma,
  useTranslation,
  type Idioma,
} from "~/traducao";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";
import { useAparencia } from "~/stores/aparencia";
import { formatTime } from "~/lib/format";

export const IdiomaSection: React.FC = () => {
  const prefs = useAparencia();
  const { t } = useTranslation();

  /*
    Um exemplo com a hora de AGORA, e não uma hora inventada.

    "13:45" e "1:45 PM" explicam a diferença, mas uma hora que não é a sua faz
    a pessoa conferir duas vezes se entendeu. Com a hora atual, o exemplo é
    verificável de relance — basta olhar o relógio.
  */
  const agora = formatTime(new Date().toISOString());

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
          A caixa de largura fixa não é enfeite: o `SelectTrigger` é `w-full`,
          e solto numa linha flexível ele cresce por cima do texto à esquerda —
          foi o que escondeu o "Agora seriam..." atrás do seletor. É a mesma
          medida que as outras telas usam, pra tudo alinhar na mesma coluna.
        */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Relógio</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              Agora seriam {agora}.
            </p>
          </div>

          <div className="w-52 shrink-0">
            <CampoSelect
              valor={prefs.horaEm24h ? "24h" : "12h"}
              onEscolher={(v) => prefs.definir({ horaEm24h: v === "24h" })}
              opcoes={[
                { valor: "24h", rotulo: t("idioma.formatoDaHora.vinteQuatro") },
                { valor: "12h", rotulo: t("idioma.formatoDaHora.dozeHoras") },
              ]}
            />
          </div>
        </div>
      </Secao>
    </div>
  );
};

/**
 * A escolha do idioma, no desenho da referência.
 *
 * Caixa com BUSCA, e não uma lista de rádios: com três idiomas a lista seria
 * mais simples, mas a referência tem trinta e quatro, e a estrutura que
 * aguenta trinta e quatro é a mesma que aguenta três. Trocar depois seria
 * refazer a tela justamente no dia em que ela ficar difícil de usar.
 *
 * Cada linha traz bandeira, nome NATIVO e nome traduzido, nessa ordem. Quem
 * procura o próprio idioma numa lista procura pela palavra que ele usa —
 * "Español" acha quem fala espanhol, "Espanhol" só acha quem já lê português.
 */
const EscolherIdioma: React.FC = () => {
  const { t } = useTranslation();
  const [busca, setBusca] = useState("");
  const [atual, setAtual] = useState(idiomaAtual);

  const encontrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return IDIOMAS;

    /// A busca cobre nome nativo, nome traduzido e o código: quem sabe que
    /// quer "pt-BR" digita "pt-BR", e não "Português do Brasil".
    return IDIOMAS.filter((idioma) =>
      `${idioma.nativo} ${idioma.nome} ${idioma.lng}`
        .toLowerCase()
        .includes(termo),
    );
  }, [busca]);

  const escolher = (lng: Idioma) => {
    setAtual(lng);
    void trocarIdioma(lng);
  };

  return (
    <div>
      {/*
        O aviso vem antes da lista: quem troca o idioma e encontra metade da
        tela em português conclui que o app está quebrado. Dizer antes
        transforma um bug aparente numa expectativa correta.
      */}
      <p className="mb-3 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
        {t("idioma.emAndamento")}
      </p>

      <div className="relative mb-2">
        <Search
          size={15}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={t("idioma.procurar")}
          aria-label={t("idioma.escolher")}
          className="h-9 pl-8 text-sm"
        />
      </div>

      <div
        role="radiogroup"
        aria-label={t("idioma.escolher")}
        className="overflow-hidden rounded-lg border border-line"
      >
        {encontrados.map((idioma) => (
          <button
            key={idioma.lng}
            type="button"
            role="radio"
            aria-checked={atual === idioma.lng}
            onClick={() => escolher(idioma.lng)}
            className={cn(
              "flex w-full items-center gap-3 border-b border-divisor px-3 py-2.5 text-left transition last:border-b-0",
              atual === idioma.lng ? "bg-selecionado" : "hover:bg-surface-3",
            )}
          >
            {/*
              A bandeira é o emoji do sistema, não uma imagem. Uma imagem por
              idioma seria uma requisição por linha e um arquivo a manter, para
              desenhar o que a fonte do sistema já desenha.
            */}
            <span aria-hidden className="shrink-0 text-lg leading-none">
              {idioma.bandeira}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {idioma.nativo}
              </span>
              <span className="block truncate text-11 text-ink-faint">
                {idioma.nome} · {idioma.lng}
              </span>
            </span>

            {atual === idioma.lng && (
              <Check size={16} className="shrink-0 text-brand" />
            )}
          </button>
        ))}

        {!encontrados.length && (
          <p className="px-3 py-6 text-center text-sm text-ink-faint">
            {t("idioma.nenhum")}
          </p>
        )}
      </div>
    </div>
  );
};
