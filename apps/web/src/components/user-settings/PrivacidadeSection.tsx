import React, { useState } from "react";
import { Download, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import { usePedirExclusao } from "~/@core/application/queries/conta/use-exclusao";
import { api } from "~/@core/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";
import { Opcao } from "~/components/user-settings/campos-de-config";

interface PrivacidadeSectionProps {
  user: SelfUserModel;
}

export const PrivacidadeSection: React.FC<PrivacidadeSectionProps> = ({
  user,
}) => {
  const salvar = useUpdateProfile();
  const [baixando, setBaixando] = useState(false);

  /*
    O download é feito na mão, e não com um `<a href>`.

    A rota exige o cabeçalho de autenticação que o `api` já carrega; um link
    comum vai sem ele e volta 401. Buscar como blob e criar a âncora na hora é
    o caminho que respeita o login — e o `revokeObjectURL` no fim evita segurar
    o arquivo inteiro na memória depois que ele já foi pro disco.
  */
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
    <div>
      <p className="text-sm text-ink-muted">
        Estas escolhas ficam na conta, e não no aparelho — elas valem contra
        outras pessoas, então quem precisa conhecê-las é o servidor.
      </p>

      <Secao
        id="amigos-e-dms"
        titulo="Amigos e mensagens diretas"
        detalhe="Quem consegue chegar até você."
      >
        <Opcao
          titulo="Aceitar pedidos de amizade"
          detalhe="Desligado, ninguém consegue te adicionar pelo nome de usuário. Quem tentar recebe a mesma resposta de quem procura um nome que não existe — dizer 'essa pessoa não aceita pedidos' confirmaria que a conta existe."
          ligado={user.aceitaPedidos}
          onMudar={(aceitaPedidos) => salvar.mutate({ aceitaPedidos })}
        />

        {/*
          Uma regra que não é escolha, e por isso aparece como texto e não como
          interruptor: fingir que dá pra mudar seria pior do que não mostrar.
        */}
        <p className="mt-4 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
          Mensagem direta só entre amigos, sempre. Não há como abrir conversa
          com quem não aceitou o seu pedido — isso não é ajustável.
        </p>
      </Secao>

      <Secao
        id="compartilhamento-de-atividade"
        titulo="Compartilhamento de atividade"
        detalhe="O que os seus amigos veem sobre o que você está fazendo."
      >
        <Opcao
          titulo="Mostrar quando estou em chamada"
          detalhe="Aparecer em 'Ativos agora' na tela de mensagens diretas. Desligado, você some de lá para os outros — mas continua se vendo, senão perderia o próprio caminho de volta pra chamada."
          ligado={user.mostraAtividade}
          onMudar={(mostraAtividade) => salvar.mutate({ mostraAtividade })}
        />
      </Secao>

      <Secao
        id="exportar-dados"
        titulo="Exportar dados"
        detalhe="Um arquivo com o que a sua conta guarda aqui."
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Baixar os meus dados</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              Conta, servidores em que você está, amigos e as suas mensagens, em
              JSON. Só o que é seu: mensagens de outras pessoas e listas de
              membros ficam de fora.
            </p>
          </div>

          <Button
            variant="surface"
            onClick={() => void exportar()}
            disabled={baixando}
          >
            {baixando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {baixando ? "Gerando…" : "Baixar"}
          </Button>
        </div>
      </Secao>

      <Secao
        id="exclusao-de-dados"
        titulo="Exclusão de dados"
        detalhe="Sair de vez — com quinze dias para mudar de ideia."
      >
        <ExcluirConta nome={user.displayName} />
      </Secao>
    </div>
  );
};

/*
  O pedido de exclusão, atrás de uma confirmação que se digita.

  Digitar o próprio nome não é burocracia: é o único jeito de garantir que o
  clique foi deliberado. Botão de confirmar se aperta por reflexo — quem digita
  seis letras já leu o que está fazendo.

  O texto insiste no prazo porque ele muda a natureza do botão: sem prazo isto
  seria irreversível, com prazo é uma decisão que dorme quinze noites.
*/
const ExcluirConta: React.FC<{ nome: string }> = ({ nome }) => {
  const [confirmando, setConfirmando] = useState(false);
  const [digitado, setDigitado] = useState("");
  const excluir = usePedirExclusao();

  const confere = digitado.trim().toLowerCase() === nome.trim().toLowerCase();

  if (!confirmando) {
    return (
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Excluir a minha conta</p>
          <p className="mt-0.5 text-xs text-ink-faint">
            A conta é desativada na hora e apagada em quinze dias. Nesse tempo
            nada é destruído: entrar de novo mostra a tela de recuperação, e
            tudo volta inteiro.
          </p>
        </div>

        <Button variant="danger" onClick={() => setConfirmando(true)}>
          <ShieldAlert size={16} /> Excluir
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-danger/40 bg-danger/5 p-4">
      <p className="text-sm font-medium text-ink">
        Para confirmar, escreva <span className="font-semibold">{nome}</span>{" "}
        abaixo.
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Você sai de todos os aparelhos agora. Se voltar dentro de quinze dias,
        encontra tudo como deixou — mensagens, amigos e servidores.
      </p>

      <Input
        value={digitado}
        onChange={(e) => setDigitado(e.target.value)}
        placeholder={nome}
        aria-label="Confirme escrevendo o seu nome"
        className="mt-3"
      />

      <div className="mt-3 flex gap-2">
        <Button
          variant="danger"
          disabled={!confere || excluir.isPending}
          onClick={() => excluir.mutate()}
        >
          {excluir.isPending ? "Excluindo…" : "Excluir a minha conta"}
        </Button>

        <Button
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
