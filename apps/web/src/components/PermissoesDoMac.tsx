import React, { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { TipoDeMidia } from "@gravae/shared";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { desktop } from "~/lib/desktop";
import { useVoicePrefs } from "~/stores/voice-prefs";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

type Estado = "concedida" | "negada" | "indefinida";

interface Linha {
  chave: string;
  titulo: string;
  descricao: string;
  estado: Estado;
  /// `null` quando não há o que fazer daqui — o macOS só deixa pelo painel dele
  conceder: (() => Promise<void>) | null;
  ajustes: () => void;
}

/// A lista guarda a CHAVE, e não o texto: é constante de módulo, avaliada uma
/// vez na carga do arquivo, e o texto escrito aqui congelaria o idioma daquele
/// instante.
const MIDIAS: { tipo: TipoDeMidia; chave: string }[] = [
  { tipo: "microphone", chave: "microfone" },
  { tipo: "camera", chave: "camera" },
  { tipo: "screen", chave: "tela" },
];

/*
  As permissões do macOS num lugar só.

  Elas são o defeito mais chato do aplicativo instalado: negadas, o botão de
  microfone, o de câmera e o de tela simplesmente não funcionam — e o macOS
  costuma perguntar UMA vez, num momento em que a pessoa não estava esperando.
  Depois disso não pergunta mais: só o painel do sistema resolve, e é preciso
  saber que ele existe.

  A tela aparece sozinha na primeira vez em que algo está faltando, e depois
  fica guardada nas Configurações de voz. Aqui não há mágica possível: para
  gravação de tela, o macOS não deixa NENHUM app pedir por conta própria — o
  máximo que dá é abrir o painel certo, já na página certa.
*/
export const PermissoesDoMac: React.FC<{ aberto: boolean; onFechar: () => void }> = ({
  aberto,
  onFechar,
}) => {
  const { t } = useTranslation();
  const ponte = desktop();
  const teclaPtt = useVoicePrefs((s) => s.teclaPtt);
  const [midias, setMidias] = useState<Record<string, Estado>>({});
  const [ptt, setPtt] = useState<Estado>("indefinida");

  const conferir = useCallback(async () => {
    if (!ponte) return;

    const lidas = await Promise.all(
      MIDIAS.map(async ({ tipo }) => [tipo, traduzir(await ponte.midia.status(tipo))] as const),
    );
    setMidias(Object.fromEntries(lidas));

    /*
      O push-to-talk não tem consulta de status: o `configurar` devolve o
      estado atual como efeito de ligar o atalho. Chamamos com o que já está
      guardado nas preferências, então isto não muda nada — só pergunta.
    */
    const estado = await ponte.ptt.configurar({ ativo: false, tecla: teclaPtt });
    setPtt(estado.indisponivel ? "negada" : estado.precisaPermissao ? "indefinida" : "concedida");
  }, [ponte, teclaPtt]);

  useEffect(() => {
    if (aberto) void conferir();
  }, [aberto, conferir]);

  /// Voltar do painel do sistema tem que refletir na hora: a pessoa concedeu lá
  /// e volta pra cá esperando ver verde.
  useEffect(() => {
    if (!aberto) return;

    const aoVoltar = () => void conferir();
    window.addEventListener("focus", aoVoltar);
    return () => window.removeEventListener("focus", aoVoltar);
  }, [aberto, conferir]);

  if (!ponte) return null;

  const linhas: Linha[] = [
    ...MIDIAS.map(({ tipo, chave }) => ({
      chave: tipo,
      titulo: t(`chamada.permissoes.${chave}`),
      descricao: t(`chamada.permissoes.${chave}Detalhe`),
      estado: midias[tipo] ?? "indefinida",
      conceder:
        tipo === "screen"
          ? null
          : async () => {
              await ponte.midia.garantir(tipo);
              await conferir();
            },
      ajustes: () => ponte.midia.abrirAjustes(tipo),
    })),
    {
      chave: "ptt",
      titulo: t("chamada.permissoes.monitoramento"),
      descricao: t("chamada.permissoes.monitoramentoDetalhe"),
      estado: ptt,
      conceder: async () => {
        await ponte.ptt.pedirPermissao({ ativo: false, tecla: teclaPtt });
        await conferir();
      },
      ajustes: () => ponte.midia.abrirAjustes("microphone"),
    },
  ];

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("chamada.permissoes.titulo")}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <p className="text-sm text-ink-muted">
            O macOS pergunta uma vez só, e depois só muda pelo painel dele. Aqui
            dá pra ver o que está valendo e resolver o que faltou.
          </p>

          <div className="mt-4 space-y-2">
            {linhas.map((linha) => (
              <div
                key={linha.chave}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface-1 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{linha.titulo}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{linha.descricao}</p>
                </div>

                {linha.estado === "concedida" ? (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-online/10 px-2.5 py-1.5 text-xs font-medium text-online">
                    <Check size={14} /> {t("chamada.permissoes.concedida")}
                  </span>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                        linha.estado === "negada"
                          ? "bg-danger/10 text-danger"
                          : "bg-amber-500/10 text-amber-400",
                      )}
                    >
                      {linha.estado === "negada" ? <X size={14} /> : null}
                      {t(linha.estado === "negada" ? "chamada.permissoes.negada" : "chamada.permissoes.naoPedida")}
                    </span>

                    {/*
                      Negada não tem volta pelo app: o macOS não pergunta duas
                      vezes. Só o painel dele resolve, e mandar a pessoa
                      "conceder" num botão que não faz nada seria pior que não
                      ter botão.
                    */}
                    {linha.conceder && linha.estado === "indefinida" ? (
                      <Button size="sm" onClick={() => void linha.conceder?.()}>
                        Permitir
                      </Button>
                    ) : (
                      <Button variant="surface" size="sm" onClick={linha.ajustes}>
                        Abrir ajustes
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

const traduzir = (status: string): Estado =>
  status === "granted" ? "concedida" : status === "denied" || status === "restricted" ? "negada" : "indefinida";
