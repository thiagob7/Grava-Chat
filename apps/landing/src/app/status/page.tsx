import type { Metadata } from "next";

import { Cabecalho } from "~/components/Cabecalho";
import { PainelDeStatus } from "~/components/PainelDeStatus";
import { Rodape } from "~/components/Rodape";

export const metadata: Metadata = {
  title: "Status do Gravaê",
  description: "Se o Gravaê está no ar, e como ele esteve nos últimos 90 dias.",
};

export default function StatusDaPlataforma() {
  return (
    <>
      <Cabecalho />

      <main className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-center text-4xl font-bold">Status</h1>
        <p className="mx-auto mb-12 mt-4 max-w-md text-center text-sm leading-relaxed text-ink-muted">
          O estado de cada peça agora, e quanto de cada dia ela esteve no ar nos
          últimos 90 dias.
        </p>

        <PainelDeStatus />

        <p className="mx-auto mt-12 max-w-md text-center text-xs leading-relaxed text-ink-faint">
          As medições são feitas de minuto em minuto pela própria API. Dia em
          cinza é dia sem medição — não é queda: é ausência de registro, quase
          sempre porque a máquina que mede estava fora. O estado de agora vem do
          seu navegador, então ele continua honesto mesmo quando o resto não
          responde.
        </p>
      </main>

      <Rodape />
    </>
  );
}
