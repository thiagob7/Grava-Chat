import React, { useState } from "react";
import { Download, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import { useRequestDeletion } from "~/@core/application/queries/conta/use-exclusao";
import { api } from "~/@core/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { Selection, Choice } from "~/features/configuracoes/components/campos-de-config";

interface PrivacySectionProps {
  user: SelfUserModel;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  user,
}) => {
  const save = useUpdateProfile();
  const [downloading, setDownloading] = useState(false);

  const doExport = async () => {
    setDownloading(true);

    try {
      const reply = await api.get("/me/exportar", { responseType: "blob" });
      const url = URL.createObjectURL(reply.data as Blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `gravae-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      toast.success("Arquivo gerado.");
    } catch {
      toast.error("Não consegui gerar o arquivo agora.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div data-gc="configuracoes.privacidade-section.div">
      <p data-gc="configuracoes.privacidade-section.p" className="text-sm text-ink-muted">
        Estas escolhas ficam na conta, e não no aparelho — elas valem contra
        outras pessoas, então quem precisa conhecê-las é o servidor.
      </p>

      <Section data-gc="configuracoes.privacidade-section.section"
        id="amigos-e-dms"
        title="Amigos e mensagens diretas"
        detail="Quem consegue chegar até você."
      >
        <Choice data-gc="configuracoes.privacidade-section.choice"
          title="Aceitar pedidos de amizade"
          detail="Desligado, ninguém consegue te adicionar pelo nome de usuário. Quem tentar recebe a mesma resposta de quem procura um nome que não existe — dizer 'essa pessoa não aceita pedidos' confirmaria que a conta existe."
          on={user.acceptedRequests}
          onChange={(acceptedRequests) => save.mutate({ acceptedRequests })}
        />

        <Choice data-gc="configuracoes.privacidade-section.choice--2"
          title="Permitir mensagens de membros dos meus servidores"
          detail="Ligado, quem divide um servidor com você consegue mandar a primeira mensagem — e ela cai em Solicitações de mensagens, não nas suas conversas. Desligado, só amigos alcançam você, e quem tentar recebe um aviso de que a mensagem não foi entregue."
          on={user.membersAllowDm}
          onChange={(membersAllowDm) => save.mutate({ membersAllowDm })}
        />

        <Selection data-gc="configuracoes.privacidade-section.selection"
          title="Filtro de spam"
          detail="O que fazer com a solicitação antes de você ver. O que for separado não some: fica na aba Spam, dentro de Solicitações de mensagens."
          value={user.spamFilter}
          options={[
            { value: "TODOS", label: "Separar toda solicitação de quem não é meu amigo" },
            {
              value: "DESCONHECIDOS",
              label: "Separar só quem não tem nenhum amigo em comum comigo (recomendado)",
            },
            { value: "NENHUM", label: "Não separar nada; tudo cai em Pedidos" },
          ]}
          onChange={(spamFilter) => save.mutate({ spamFilter })}
        />
      </Section>

      <Section data-gc="configuracoes.privacidade-section.section--2"
        id="compartilhamento-de-atividade"
        title="Compartilhamento de atividade"
        detail="O que os seus amigos veem sobre o que você está fazendo."
      >
        <Choice data-gc="configuracoes.privacidade-section.choice--3"
          title="Mostrar quando estou em chamada"
          detail="Aparecer em 'Ativos agora' na tela de mensagens diretas. Desligado, você some de lá para os outros — mas continua se vendo, senão perderia o próprio caminho de volta pra chamada."
          on={user.showsActivity}
          onChange={(showsActivity) => save.mutate({ showsActivity })}
        />
      </Section>

      <Section data-gc="configuracoes.privacidade-section.section--3"
        id="visibilidade-do-perfil"
        title="Visibilidade do perfil"
        detail="O que o seu perfil conta sobre você para quem abre ele."
      >
        <Choice data-gc="configuracoes.privacidade-section.choice--4"
          title="Mostrar servidores em comum"
          detail="A aba que diz de quais servidores vocês dois participam. A lista desenha a sua rotina — onde você passa o dia, de que comunidade faz parte. Desligado, ela vem vazia para todo mundo; a sua continua completa."
          on={user.showsServersCommon}
          onChange={(showsServersCommon) =>
            save.mutate({ showsServersCommon })
          }
        />

        <Choice data-gc="configuracoes.privacidade-section.choice--5"
          title="Mostrar amigos em comum"
          detail="A aba com as pessoas que vocês dois conhecem. É a sua rede, e é uma pergunta diferente da de cima — por isso são dois interruptores, e não um."
          on={user.showsFriendsCommon}
          onChange={(showsFriendsCommon) =>
            save.mutate({ showsFriendsCommon })
          }
        />

        <p data-gc="configuracoes.privacidade-section.p--2" className="mt-4 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
          Quem esconde, esconde no servidor: com o interruptor desligado a lista
          nem sai daqui. Não é a outra tela deixando de desenhar.
        </p>
      </Section>

      <Section data-gc="configuracoes.privacidade-section.section--4"
        id="exportar-dados"
        title="Exportar dados"
        detail="Um arquivo com o que a sua conta guarda aqui."
      >
        <div data-gc="configuracoes.privacidade-section.div--2" className="flex items-start gap-4">
          <div data-gc="configuracoes.privacidade-section.div--3" className="min-w-0 flex-1">
            <p data-gc="configuracoes.privacidade-section.p--3" className="text-sm font-medium">Baixar os meus dados</p>
            <p data-gc="configuracoes.privacidade-section.p--4" className="mt-0.5 text-xs text-ink-faint">
              Conta, servidores em que você está, amigos e as suas mensagens, em
              JSON. Só o que é seu: mensagens de outras pessoas e listas de
              membros ficam de fora.
            </p>
          </div>

          <Button data-gc="configuracoes.privacidade-section.button"
            variant="surface"
            onClick={() => void doExport()}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 data-gc="configuracoes.privacidade-section.loader2" size={16} className="animate-spin" />
            ) : (
              <Download data-gc="configuracoes.privacidade-section.download" size={16} />
            )}
            {downloading ? "Gerando…" : "Baixar"}
          </Button>
        </div>
      </Section>

      <Section data-gc="configuracoes.privacidade-section.section--5"
        id="exclusao-de-dados"
        title="Exclusão de dados"
        detail="Sair de vez — com quinze dias para mudar de ideia."
      >
        <DeleteAccount data-gc="configuracoes.privacidade-section.delete-account" name={user.displayName} />
      </Section>
    </div>
  );
};

const DeleteAccount: React.FC<{ name: string }> = ({ name }) => {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const doDelete = useRequestDeletion();

  const checks = typed.trim().toLowerCase() === name.trim().toLowerCase();

  if (!confirming) {
    return (
      <div data-gc="configuracoes.privacidade-section.div--4" className="flex items-start gap-4">
        <div data-gc="configuracoes.privacidade-section.div--5" className="min-w-0 flex-1">
          <p data-gc="configuracoes.privacidade-section.p--5" className="text-sm font-medium">Excluir a minha conta</p>
          <p data-gc="configuracoes.privacidade-section.p--6" className="mt-0.5 text-xs text-ink-faint">
            A conta é desativada na hora e apagada em quinze dias. Nesse tempo
            nada é destruído: entrar de novo mostra a tela de recuperação, e
            tudo volta inteiro.
          </p>
        </div>

        <Button data-gc="configuracoes.privacidade-section.button--2" variant="danger" onClick={() => setConfirming(true)}>
          <ShieldAlert data-gc="configuracoes.privacidade-section.shield-alert" size={16} /> Excluir
        </Button>
      </div>
    );
  }

  return (
    <div data-gc="configuracoes.privacidade-section.div--6" className="rounded-lg border border-danger/40 bg-danger/5 p-4">
      <p data-gc="configuracoes.privacidade-section.p--7" className="text-sm font-medium text-ink">
        Para confirmar, escreva <span data-gc="configuracoes.privacidade-section.span" className="font-semibold">{name}</span>{" "}
        abaixo.
      </p>
      <p data-gc="configuracoes.privacidade-section.p--8" className="mt-1 text-xs text-ink-muted">
        Você sai de todos os aparelhos agora. Se voltar dentro de quinze dias,
        encontra tudo como deixou — mensagens, amigos e servidores.
      </p>

      <Input data-gc="configuracoes.privacidade-section.input"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={name}
        aria-label="Confirme escrevendo o seu nome"
        className="mt-3"
      />

      <div data-gc="configuracoes.privacidade-section.div--7" className="mt-3 flex gap-2">
        <Button data-gc="configuracoes.privacidade-section.button--3"
          variant="danger"
          disabled={!checks || doDelete.isPending}
          onClick={() => doDelete.mutate()}
        >
          {doDelete.isPending ? "Excluindo…" : "Excluir a minha conta"}
        </Button>

        <Button data-gc="configuracoes.privacidade-section.button--4"
          variant="surface"
          onClick={() => {
            setConfirming(false);
            setTyped("");
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};
