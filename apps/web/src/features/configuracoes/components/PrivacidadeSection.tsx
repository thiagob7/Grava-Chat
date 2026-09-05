import React, { useState } from "react";
import { Download, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import { usePedirExclusao } from "~/@core/application/queries/conta/use-exclusao";
import { api } from "~/@core/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";
import { Opcao } from "~/features/configuracoes/components/campos-de-config";

interface PrivacidadeSectionProps {
  user: SelfUserModel;
}

export const PrivacidadeSection: React.FC<PrivacidadeSectionProps> = ({
  user,
}) => {
  const salvar = useUpdateProfile();
  const [baixando, setBaixando] = useState(false);

  const exportar = async () => {
    setBaixando(true);

    try {
      const resposta = await api.get("/me/exportar", { responseType: "blob" });
      const url = URL.createObjectURL(resposta.data as Blob);
      const ancora = document.createElement("a");

      ancora.href = url;
      ancora.download = `gravae-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(ancora);
      ancora.click();
      ancora.remove();
      URL.revokeObjectURL(url);

      toast.success("Arquivo gerado.");
    } catch {
      toast.error("Não consegui gerar o arquivo agora.");
    } finally {
      setBaixando(false);
    }
  };

  return (
    <div data-gc="configuracoes.privacidade-section.div">
      <p data-gc="configuracoes.privacidade-section.p" className="text-sm text-ink-muted">
        Estas escolhas ficam na conta, e não no aparelho — elas valem contra
        outras pessoas, então quem precisa conhecê-las é o servidor.
      </p>

      <Secao data-gc="configuracoes.privacidade-section.secao"
        id="amigos-e-dms"
        titulo="Amigos e mensagens diretas"
        detalhe="Quem consegue chegar até você."
      >
        <Opcao data-gc="configuracoes.privacidade-section.opcao"
          titulo="Aceitar pedidos de amizade"
          detalhe="Desligado, ninguém consegue te adicionar pelo nome de usuário. Quem tentar recebe a mesma resposta de quem procura um nome que não existe — dizer 'essa pessoa não aceita pedidos' confirmaria que a conta existe."
          ligado={user.aceitaPedidos}
          onMudar={(aceitaPedidos) => salvar.mutate({ aceitaPedidos })}
        />

        <p data-gc="configuracoes.privacidade-section.p--2" className="mt-4 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
          Mensagem direta só entre amigos, sempre. Não há como abrir conversa
          com quem não aceitou o seu pedido — isso não é ajustável.
        </p>
      </Secao>

      <Secao data-gc="configuracoes.privacidade-section.secao--2"
        id="compartilhamento-de-atividade"
        titulo="Compartilhamento de atividade"
        detalhe="O que os seus amigos veem sobre o que você está fazendo."
      >
        <Opcao data-gc="configuracoes.privacidade-section.opcao--2"
          titulo="Mostrar quando estou em chamada"
          detalhe="Aparecer em 'Ativos agora' na tela de mensagens diretas. Desligado, você some de lá para os outros — mas continua se vendo, senão perderia o próprio caminho de volta pra chamada."
          ligado={user.mostraAtividade}
          onMudar={(mostraAtividade) => salvar.mutate({ mostraAtividade })}
        />
      </Secao>

      <Secao data-gc="configuracoes.privacidade-section.secao--3"
        id="visibilidade-do-perfil"
        titulo="Visibilidade do perfil"
        detalhe="O que o seu perfil conta sobre você para quem abre ele."
      >
        <Opcao data-gc="configuracoes.privacidade-section.opcao--3"
          titulo="Mostrar servidores em comum"
          detalhe="A aba que diz de quais servidores vocês dois participam. A lista desenha a sua rotina — onde você passa o dia, de que comunidade faz parte. Desligado, ela vem vazia para todo mundo; a sua continua completa."
          ligado={user.mostraServidoresEmComum}
          onMudar={(mostraServidoresEmComum) =>
            salvar.mutate({ mostraServidoresEmComum })
          }
        />

        <Opcao data-gc="configuracoes.privacidade-section.opcao--4"
          titulo="Mostrar amigos em comum"
          detalhe="A aba com as pessoas que vocês dois conhecem. É a sua rede, e é uma pergunta diferente da de cima — por isso são dois interruptores, e não um."
          ligado={user.mostraAmigosEmComum}
          onMudar={(mostraAmigosEmComum) =>
            salvar.mutate({ mostraAmigosEmComum })
          }
        />

        <p data-gc="configuracoes.privacidade-section.p--3" className="mt-4 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
          Quem esconde, esconde no servidor: com o interruptor desligado a lista
          nem sai daqui. Não é a outra tela deixando de desenhar.
        </p>
      </Secao>

      <Secao data-gc="configuracoes.privacidade-section.secao--4"
        id="exportar-dados"
        titulo="Exportar dados"
        detalhe="Um arquivo com o que a sua conta guarda aqui."
      >
        <div data-gc="configuracoes.privacidade-section.div--2" className="flex items-start gap-4">
          <div data-gc="configuracoes.privacidade-section.div--3" className="min-w-0 flex-1">
            <p data-gc="configuracoes.privacidade-section.p--4" className="text-sm font-medium">Baixar os meus dados</p>
            <p data-gc="configuracoes.privacidade-section.p--5" className="mt-0.5 text-xs text-ink-faint">
              Conta, servidores em que você está, amigos e as suas mensagens, em
              JSON. Só o que é seu: mensagens de outras pessoas e listas de
              membros ficam de fora.
            </p>
          </div>

          <Button data-gc="configuracoes.privacidade-section.button"
            variant="surface"
            onClick={() => void exportar()}
            disabled={baixando}
          >
            {baixando ? (
              <Loader2 data-gc="configuracoes.privacidade-section.loader2" size={16} className="animate-spin" />
            ) : (
              <Download data-gc="configuracoes.privacidade-section.download" size={16} />
            )}
            {baixando ? "Gerando…" : "Baixar"}
          </Button>
        </div>
      </Secao>

      <Secao data-gc="configuracoes.privacidade-section.secao--5"
        id="exclusao-de-dados"
        titulo="Exclusão de dados"
        detalhe="Sair de vez — com quinze dias para mudar de ideia."
      >
        <ExcluirConta data-gc="configuracoes.privacidade-section.excluir-conta" nome={user.displayName} />
      </Secao>
    </div>
  );
};

const ExcluirConta: React.FC<{ nome: string }> = ({ nome }) => {
  const [confirmando, setConfirmando] = useState(false);
  const [digitado, setDigitado] = useState("");
  const excluir = usePedirExclusao();

  const confere = digitado.trim().toLowerCase() === nome.trim().toLowerCase();

  if (!confirmando) {
    return (
      <div data-gc="configuracoes.privacidade-section.div--4" className="flex items-start gap-4">
        <div data-gc="configuracoes.privacidade-section.div--5" className="min-w-0 flex-1">
          <p data-gc="configuracoes.privacidade-section.p--6" className="text-sm font-medium">Excluir a minha conta</p>
          <p data-gc="configuracoes.privacidade-section.p--7" className="mt-0.5 text-xs text-ink-faint">
            A conta é desativada na hora e apagada em quinze dias. Nesse tempo
            nada é destruído: entrar de novo mostra a tela de recuperação, e
            tudo volta inteiro.
          </p>
        </div>

        <Button data-gc="configuracoes.privacidade-section.button--2" variant="danger" onClick={() => setConfirmando(true)}>
          <ShieldAlert data-gc="configuracoes.privacidade-section.shield-alert" size={16} /> Excluir
        </Button>
      </div>
    );
  }

  return (
    <div data-gc="configuracoes.privacidade-section.div--6" className="rounded-lg border border-danger/40 bg-danger/5 p-4">
      <p data-gc="configuracoes.privacidade-section.p--8" className="text-sm font-medium text-ink">
        Para confirmar, escreva <span data-gc="configuracoes.privacidade-section.span" className="font-semibold">{nome}</span>{" "}
        abaixo.
      </p>
      <p data-gc="configuracoes.privacidade-section.p--9" className="mt-1 text-xs text-ink-muted">
        Você sai de todos os aparelhos agora. Se voltar dentro de quinze dias,
        encontra tudo como deixou — mensagens, amigos e servidores.
      </p>

      <Input data-gc="configuracoes.privacidade-section.input"
        value={digitado}
        onChange={(e) => setDigitado(e.target.value)}
        placeholder={nome}
        aria-label="Confirme escrevendo o seu nome"
        className="mt-3"
      />

      <div data-gc="configuracoes.privacidade-section.div--7" className="mt-3 flex gap-2">
        <Button data-gc="configuracoes.privacidade-section.button--3"
          variant="danger"
          disabled={!confere || excluir.isPending}
          onClick={() => excluir.mutate()}
        >
          {excluir.isPending ? "Excluindo…" : "Excluir a minha conta"}
        </Button>

        <Button data-gc="configuracoes.privacidade-section.button--4"
          variant="surface"
          onClick={() => {
            setConfirmando(false);
            setDigitado("");
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};
