import React, { useState } from "react";
import { Eye, Info, Megaphone, Send, Users } from "lucide-react";
import { toast } from "react-toastify";

import { useCountPeople, useSendAnnouncement } from "~/@core/application/queries/admin/use-comunicados";
import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import { Textarea } from "~/components/ui/input";
import { Callout, Panel, StatusPill } from "~/features/configuracoes/components/painel/PainelUi";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import { cn } from "~/lib/utils";

const LIMIT = 4000;
const HOUSE_NAME = "Ravox Chat";

export const AnnouncementsSection: React.FC = () => {
  const [text, setText] = useState("");
  const people = useCountPeople(true);
  const dispatch = useSendAnnouncement();
  const confirm = useConfirm();

  const count = people.data?.total ?? 0;
  const written = text.trim();
  const nearLimit = text.length > LIMIT * 0.9;

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
      { content: written },
      {
        onSuccess: ({ recipients }) => {
          toast.success(`Comunicado a caminho de ${recipients} ${recipients === 1 ? "pessoa" : "pessoas"}.`);
          setText("");
        },
      },
    );
  };

  return (
    <div data-gc="configuracoes.comunicados-section.div" className="grid w-full items-start gap-6 pb-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Panel data-gc="configuracoes.comunicados-section.panel"
        title="Escrever"
        icon={<Megaphone data-gc="configuracoes.comunicados-section.megaphone" size={16} />}
        description="Chega como mensagem direta da conta do sistema"
        actions={
          <StatusPill data-gc="configuracoes.comunicados-section.status-pill" tone="brand" dot={false}>
            <Users data-gc="configuracoes.comunicados-section.users" size={12} /> {people.isPending ? "…" : count} {count === 1 ? "pessoa" : "pessoas"}
          </StatusPill>
        }
      >
        <Textarea data-gc="configuracoes.comunicados-section.textarea"
          id="texto-do-comunicado"
          aria-label="Mensagem do comunicado"
          value={text}
          rows={10}
          maxLength={LIMIT}
          placeholder="Ex: O Ravox Chat vai ficar fora do ar hoje às 22h, por uns dez minutos."
          onChange={(e) => setText(e.target.value)}
        />

        <div data-gc="configuracoes.comunicados-section.div--2" className="mt-3 flex flex-wrap items-center gap-3">
          <span data-gc="configuracoes.comunicados-section.span" className="text-xs text-ink-faint">Sem contar bots nem a conta do sistema.</span>
          <span data-gc="configuracoes.comunicados-section.span--2" className={cn("ml-auto text-xs tabular-nums", nearLimit ? "text-aviso" : "text-ink-faint")}>
            {text.length} / {LIMIT}
          </span>
          <Button data-gc="configuracoes.comunicados-section.button" disabled={!written || !count} onClick={() => void send()} loading={dispatch.isPending}>
            <Send data-gc="configuracoes.comunicados-section.send" size={15} /> Mandar comunicado
          </Button>
        </div>
      </Panel>

      <div data-gc="configuracoes.comunicados-section.div--3" className="space-y-4">
        <Panel data-gc="configuracoes.comunicados-section.panel--2" title="Como chega" icon={<Eye data-gc="configuracoes.comunicados-section.eye" size={16} />} description="Prévia na conversa de cada pessoa">
          <div data-gc="configuracoes.comunicados-section.div--4" className="flex gap-3 rounded-lg bg-surface-2 p-3">
            <Avatar data-gc="configuracoes.comunicados-section.avatar" id="gravae-sistema" name={HOUSE_NAME} url="/brand/icone-512.png" size={40} />
            <div data-gc="configuracoes.comunicados-section.div--5" className="min-w-0 flex-1">
              <div data-gc="configuracoes.comunicados-section.div--6" className="flex items-baseline gap-2">
                <UserName data-gc="configuracoes.comunicados-section.user-name" name={HOUSE_NAME} isSystem className="font-medium text-ink" />
                <span data-gc="configuracoes.comunicados-section.span--3" className="text-xs text-ink-faint">agora</span>
              </div>
              <p data-gc="configuracoes.comunicados-section.p" className={cn("mt-0.5 whitespace-pre-wrap break-words text-sm", written ? "text-ink" : "italic text-ink-faint")}>
                {written || "O que você escrever aparece aqui."}
              </p>
            </div>
          </div>
        </Panel>

        <Callout data-gc="configuracoes.comunicados-section.callout" tone="warn" icon={<Info data-gc="configuracoes.comunicados-section.info" size={16} />} title="Antes de mandar">
          Vai para todo mundo de uma vez e não dá para apagar depois. Use para aviso de manutenção, mudança importante
          ou problema que afeta a todos.
        </Callout>
      </div>
    </div>
  );
};
