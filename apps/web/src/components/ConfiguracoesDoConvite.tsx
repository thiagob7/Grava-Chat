import React, { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/input";
import { Combobox } from "~/components/ui/combobox";

export interface OpcoesDoConvite {
  /// `null` = não expira
  expiresInHours: number | null;
  /// `null` = usos ilimitados
  maxUses: number | null;
}

/*
  As duas listas guardam `0` no lugar de `null`.

  `null` não serve como valor de campo: ele significa "sem escolha", e o campo
  cairia no vazio em vez de mostrar "Nunca" — que é uma escolha, e a mais comum
  delas. `0` é o sentinela, e a conversão para `null` acontece só na saída,
  onde a API espera.
*/
const SEM_LIMITE = 0;

const VALIDADES: { valor: number; rotulo: string }[] = [
  { valor: 0.5, rotulo: "30 minutos" },
  { valor: 1, rotulo: "1 hora" },
  { valor: 6, rotulo: "6 horas" },
  { valor: 12, rotulo: "12 horas" },
  { valor: 24, rotulo: "1 dia" },
  { valor: 24 * 7, rotulo: "7 dias" },
  { valor: 24 * 30, rotulo: "30 dias" },
  { valor: SEM_LIMITE, rotulo: "Nunca" },
];

const USOS: { valor: number; rotulo: string }[] = [
  { valor: SEM_LIMITE, rotulo: "Sem limite" },
  { valor: 1, rotulo: "1 uso" },
  { valor: 5, rotulo: "5 usos" },
  { valor: 10, rotulo: "10 usos" },
  { valor: 25, rotulo: "25 usos" },
  { valor: 50, rotulo: "50 usos" },
  { valor: 100, rotulo: "100 usos" },
];

interface Props {
  atuais: OpcoesDoConvite;
  gerando?: boolean;
  /// volta pra lista de amigos sem mudar nada
  onVoltar: () => void;
  onCriar: (opcoes: OpcoesDoConvite) => void;
}

/**
 * As opções do link de convite: validade e número de usos.
 *
 * É CONTEÚDO, não diálogo. Ele troca de lugar com a lista de amigos dentro da
 * mesma caixa, em vez de abrir uma segunda por cima — duas caixas empilhadas
 * escondem a primeira atrás de um véu e fazem parecer que se saiu de onde
 * estava, quando isto aqui é o mesmo assunto continuando. Sair sem confirmar
 * não muda nada: o link que estava na tela continua valendo.
 *
 * Não há "associação temporária" aqui, que é a terceira opção da referência:
 * ela remove o membro quando ele fica offline, e isso não existe no nosso
 * modelo de convite nem no de membro. Um interruptor que não liga nada é pior
 * que a opção ausente.
 */
export const ConfiguracoesDoConvite: React.FC<Props> = ({
  atuais,
  gerando,
  onVoltar,
  onCriar,
}) => {
  const [validade, setValidade] = useState(atuais.expiresInHours ?? SEM_LIMITE);
  const [usos, setUsos] = useState(atuais.maxUses ?? SEM_LIMITE);

  /*
    Voltar e entrar de novo mostra o que está valendo AGORA.

    O componente é montado a cada entrada na vista de opções, então o estado
    inicial já seria o certo — este efeito cobre o caso de o link ser trocado
    com a tela aberta, que é o que acontece logo depois de "Criar novo link".
  */
  useEffect(() => {
    setValidade(atuais.expiresInHours ?? SEM_LIMITE);
    setUsos(atuais.maxUses ?? SEM_LIMITE);
  }, [atuais.expiresInHours, atuais.maxUses]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Configurações do link de convite</DialogTitle>
      </DialogHeader>

      {/*
        A altura mínima é o que aproxima esta etapa da caixa da referência: lá
        ela tem um interruptor a mais ("associação temporária") que aqui não
        existe, e sem ele a caixa ficava um terço mais baixa que a dela.
      */}
      <DialogBody className="cascata min-h-[24rem] space-y-5">
        <div>
          <Label htmlFor="convite-validade">Expira em</Label>
          <Combobox
            id="convite-validade"
            valor={validade}
            onEscolher={setValidade}
            opcoes={VALIDADES}
            placeholder="Escolha ou digite…"
          />
        </div>

        <div>
          <Label htmlFor="convite-usos">Número máximo de usos</Label>
          <Combobox
            id="convite-usos"
            valor={usos}
            onEscolher={setUsos}
            opcoes={USOS}
            placeholder="Escolha ou digite…"
          />
        </div>

        {/*
          O aviso é o que separa esta tela de um formulário comum: confirmar
          não EDITA o link que está na tela, cria outro. O antigo continua de
          pé e continua funcionando para quem já o recebeu — que é o que a
          palavra "novo" no botão promete, e o que a pessoa precisa saber
          antes de apertar.
        */}
        <p className="text-xs text-ink-faint">
          O link que já está na tela continua funcionando para quem o recebeu.
          Confirmar cria um link novo, com estas opções.
        </p>
      </DialogBody>

      <DialogFooter>
        <Button variant="surface" onClick={onVoltar} disabled={gerando}>
          Cancelar
        </Button>

        <Button
          onClick={() =>
            onCriar({
              expiresInHours: validade === SEM_LIMITE ? null : validade,
              maxUses: usos === SEM_LIMITE ? null : usos,
            })
          }
          disabled={gerando}
        >
          {gerando ? "Criando…" : "Criar novo link"}
        </Button>
      </DialogFooter>
    </>
  );
};
