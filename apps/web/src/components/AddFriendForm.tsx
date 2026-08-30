import React, { useState } from "react";
import { UserRoundPlus } from "lucide-react";

import { useRequestFriend } from "~/@core/application/queries/friend/use-request-friend";
import { Button } from "~/components/ui/button";
import { CampoComAcao } from "~/components/ui/input";

export const AddFriendForm: React.FC = () => {
  const requestFriend = useRequestFriend();
  const [username, setUsername] = useState("");

  const enviar = async () => {
    const alvo = username.trim();
    if (!alvo) return;

    const resultado = await requestFriend.mutateAsync(alvo).catch(() => null);
    if (resultado) setUsername("");
  };

  return (
    /*
      Centralizado, e não colado no topo da página.

      A aba de adicionar amigo é uma tela de UMA tarefa: não há lista, não há
      nada abaixo. Encostado no topo, o formulário ficava sozinho num canto com
      uma área vazia enorme embaixo — parecia uma página que não terminou de
      carregar. No meio, ele é claramente a coisa a fazer ali.
    */
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand/15 text-brand">
        <UserRoundPlus size={30} />
      </span>

      <h2 className="mt-5 text-xl font-semibold">Adicionar amigo</h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        Você pode adicionar amigos pelo nome de usuário deles.
      </p>

      <div className="mt-6 w-full max-w-lg text-left">
        <CampoComAcao
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void enviar()}
          placeholder="Nome de usuário, ex: thiago"
          acao={
            <Button
              size="sm"
              onClick={() => void enviar()}
              disabled={!username.trim() || requestFriend.isPending}
            >
              {requestFriend.isPending ? "Enviando…" : "Enviar pedido"}
            </Button>
          }
        />
      </div>
    </div>
  );
};
