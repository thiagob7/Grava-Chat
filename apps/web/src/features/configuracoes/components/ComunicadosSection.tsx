import React, { useState } from "react";
import { Megaphone } from "lucide-react";
import { toast } from "react-toastify";

import { useContarPessoas, useMandarComunicado } from "~/@core/application/queries/admin/use-comunicados";
import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import { Label, Textarea } from "~/components/ui/input";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";

const LIMITE = 4000;

export const ComunicadosSection: React.FC = () => {
  const [text, setTexto] = useState("");
  const pessoas = useContarPessoas(true);
  const mandar = useMandarComunicado();
  const confirm = useConfirm();

  const quantos = pessoas.data?.total ?? 0;

  const enviar = async () => {
    const { confirmed } = await confirm({
      title: `Mandar para ${quantos} ${quantos === 1 ? "pessoa" : "pessoas"}?`,
      description:
        "A mensagem chega na conversa de cada uma com a conta do sistema, na hora. Depois de enviada não dá para tirar.",
      action: "Mandar",
      destructive: true,
    });

    if (!confirmed) return;

    mandar.mutate(
      { conteudo: text.trim() },
      {
        onSuccess: ({ destinatarios }) => {
          toast.success(`Comunicado a caminho de ${destinatarios} ${destinatarios === 1 ? "pessoa" : "pessoas"}.`);
          setTexto("");
        },
      },
    );
  };

  return (
    <div data-gc="configuracoes.comunicados-section.div" className="max-w-2xl pb-10">
      <Secao data-gc="configuracoes.comunicados-section.secao" id="comunicado" titulo="Comunicado do sistema">
        <div data-gc="configuracoes.comunicados-section.div--2" className="rounded-lg bg-surface-2 p-5">
          <p data-gc="configuracoes.comunicados-section.p" className="flex items-center gap-2 text-sm text-ink-muted">
            <Megaphone data-gc="configuracoes.comunicados-section.megaphone" size={16} className="shrink-0 text-ink-faint" />
            Escrito aqui, chega como mensagem da conta do sistema para cada pessoa.
          </p>

          <div data-gc="configuracoes.comunicados-section.div--3" className="mt-5">
            <Label data-gc="configuracoes.comunicados-section.label" htmlFor="texto-do-comunicado">Mensagem</Label>
            <Textarea data-gc="configuracoes.comunicados-section.textarea"
              id="texto-do-comunicado"
              value={text}
              rows={6}
              maxLength={LIMITE}
              placeholder="Ex: O Gravaê vai ficar fora do ar hoje às 22h, por uns dez minutos."
              onChange={(e) => setTexto(e.target.value)}
            />
            <p data-gc="configuracoes.comunicados-section.p--2" className="mt-1.5 flex items-center justify-between text-xs text-ink-faint">
              <span data-gc="configuracoes.comunicados-section.span">Vai para {quantos} {quantos === 1 ? "pessoa" : "pessoas"}, sem contar bots.</span>
              <span data-gc="configuracoes.comunicados-section.span--2">{text.length} / {LIMITE}</span>
            </p>
          </div>

          <Button data-gc="configuracoes.comunicados-section.button"
            className="mt-5"
            disabled={!text.trim() || mandar.isPending || !quantos}
            onClick={() => void enviar()}
          >
            {mandar.isPending ? "Mandando…" : "Mandar comunicado"}
          </Button>
        </div>
      </Secao>
    </div>
  );
};
