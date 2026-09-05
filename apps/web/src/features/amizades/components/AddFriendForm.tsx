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
    <div data-gc="amizades.add-friend-form.div" className="flex h-full flex-col items-center justify-center px-6 text-center">
      <span data-gc="amizades.add-friend-form.span" className="flex size-16 items-center justify-center rounded-full bg-brand/15 text-brand">
        <UserRoundPlus data-gc="amizades.add-friend-form.user-round-plus" size={30} />
      </span>

      <h2 data-gc="amizades.add-friend-form.h2" className="mt-5 text-xl font-semibold">Adicionar amigo</h2>
      <p data-gc="amizades.add-friend-form.p" className="mt-1.5 text-sm text-ink-muted">
        Você pode adicionar amigos pelo nome de usuário deles.
      </p>

      <div data-gc="amizades.add-friend-form.div--2" className="mt-6 w-full max-w-lg text-left">
        <CampoComAcao data-gc="amizades.add-friend-form.campo-com-acao"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void enviar()}
          placeholder="Nome de usuário, ex: thiago"
          acao={
            <Button data-gc="amizades.add-friend-form.button"
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
