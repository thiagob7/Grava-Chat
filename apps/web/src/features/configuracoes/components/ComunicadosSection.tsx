import React, { useState } from "react";
import { Megaphone } from "lucide-react";
import { toast } from "react-toastify";

import { useCountPeople, useSendAnnouncement } from "~/@core/application/queries/admin/use-comunicados";
import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import { Label, Textarea } from "~/components/ui/input";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";

const LIMIT = 4000;

export const AnnouncementsSection: React.FC = () => {
  const [text, setText] = useState("");
  const people = useCountPeople(true);
  const dispatch = useSendAnnouncement();
  const confirm = useConfirm();

  const count = people.data?.total ?? 0;

  const send = async () => {
    const { confirmed } = await confirm({
      title: `Mandar para ${count} ${count === 1 ? "pessoa" : "pessoas"}?`,
      description:
        "A mensagem chega na conversa de cada uma com a conta do sistema, na hora. Depois de enviada não dá para tirar.",
      action: "Mandar",
      destructive: true,
    });

    if (!confirmed) return;

    dispatch.mutate(
      { content: text.trim() },
      {
        onSuccess: ({ recipients }) => {
          toast.success(`Comunicado a caminho de ${recipients} ${recipients === 1 ? "pessoa" : "pessoas"}.`);
          setText("");
        },
      },
    );
  };

  return (
    <div data-gc="configuracoes.comunicados-section.div" className="max-w-2xl pb-10">
      <Section data-gc="configuracoes.comunicados-section.section" id="comunicado" title="Comunicado do sistema">
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
              maxLength={LIMIT}
              placeholder="Ex: O Gravaê vai ficar fora do ar hoje às 22h, por uns dez minutos."
              onChange={(e) => setText(e.target.value)}
            />
            <p data-gc="configuracoes.comunicados-section.p--2" className="mt-1.5 flex items-center justify-between text-xs text-ink-faint">
              <span data-gc="configuracoes.comunicados-section.span">Vai para {count} {count === 1 ? "pessoa" : "pessoas"}, sem contar bots.</span>
              <span data-gc="configuracoes.comunicados-section.span--2">{text.length} / {LIMIT}</span>
            </p>
          </div>

          <Button data-gc="configuracoes.comunicados-section.button"
            className="mt-5"
            disabled={!text.trim() || dispatch.isPending || !count}
            onClick={() => void send()}
          >
            {dispatch.isPending ? "Mandando…" : "Mandar comunicado"}
          </Button>
        </div>
      </Section>
    </div>
  );
};
