import React, { useState } from "react";

import { useRequestFriend } from "~/@core/application/queries/friend/use-request-friend";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

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
    <div className="border-b border-line pb-6">
      <h2 className="text-base font-semibold uppercase">Adicionar amigo</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Você pode adicionar amigos pelo nome de usuário deles.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-0 p-1 pl-3">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void enviar()}
          placeholder="Nome de usuário, ex: thiago"
          className="bg-transparent px-0"
        />
        <Button onClick={() => void enviar()} disabled={!username.trim() || requestFriend.isPending}>
          {requestFriend.isPending ? "Enviando…" : "Enviar pedido"}
        </Button>
      </div>
    </div>
  );
};
