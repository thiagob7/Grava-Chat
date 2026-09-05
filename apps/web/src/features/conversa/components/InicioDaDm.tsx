import React from "react";

import { useFindEmComum } from "~/@core/application/queries/user/use-find-em-comum";
import { useFindProfile } from "~/@core/application/queries/user/use-find-profile";
import { useRequestFriend } from "~/@core/application/queries/friend/use-request-friend";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { Avatar } from "~/features/perfil/components/Avatar";
import type { PublicUser } from "@gravae/shared";

/*
  O topo de uma conversa vazia.

  Não é decoração: é onde a pessoa decide se conhece quem está do outro lado.
  Por isso as comunidades em comum vêm antes do botão de amizade — primeiro o
  que vocês têm junto, depois o convite.
*/
export const InicioDaDm: React.FC<{ pessoa: PublicUser }> = ({ pessoa }) => {
  const { data: perfil } = useFindProfile(pessoa.id);
  const { data: emComum } = useFindEmComum(pessoa.id, true);
  const pedir = useRequestFriend();

  const servidores = emComum?.servidores ?? [];
  const podePedir = perfil ? perfil.friendship === "NONE" : false;

  return (
    <div data-gc="conversa.inicio-da-dm.div" className="flex flex-col items-center px-4 pb-8 pt-10 text-center">
      <Avatar data-gc="conversa.inicio-da-dm.avatar"
        id={pessoa.id}
        name={pessoa.displayName}
        url={pessoa.avatarUrl}
        status={pessoa.status}
        size={80}
      />

      <h2 data-gc="conversa.inicio-da-dm.h2" className="mt-4 text-2xl font-bold">{pessoa.username}</h2>

      <p data-gc="conversa.inicio-da-dm.p" className="mt-3 text-ink-muted">
        Diga oi para <strong data-gc="conversa.inicio-da-dm.strong" className="font-semibold text-ink">{pessoa.displayName}</strong>. Sua
        conversa começa aqui.
      </p>

      {(servidores.length > 0 || podePedir) && (
        <div data-gc="conversa.inicio-da-dm.div--2" className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {servidores.length > 0 && (
            <>
              <span data-gc="conversa.inicio-da-dm.span" className="flex -space-x-2">
                {servidores.slice(0, 3).map((servidor) => (
                  <Tooltip data-gc="conversa.inicio-da-dm.tooltip" key={servidor.id} label={servidor.name}>
                    <span data-gc="conversa.inicio-da-dm.span--2" className="size-6 overflow-hidden rounded-md ring-2 ring-surface-2">
                      {servidor.iconUrl ? (
                        <img data-gc="conversa.inicio-da-dm.img"
                          src={servidor.iconUrl}
                          alt=""
                          className="size-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span data-gc="conversa.inicio-da-dm.span--3" className="flex size-full items-center justify-center bg-surface-4 text-10 font-semibold">
                          {servidor.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </span>
                  </Tooltip>
                ))}

                {servidores.length > 3 && (
                  <span data-gc="conversa.inicio-da-dm.span--4" className="flex size-6 items-center justify-center rounded-md bg-surface-4 text-10 font-semibold ring-2 ring-surface-2">
                    +{servidores.length - 3}
                  </span>
                )}
              </span>

              <span data-gc="conversa.inicio-da-dm.span--5" className="text-sm text-ink-muted">
                {servidores.length}{" "}
                {servidores.length === 1 ? "comunidade em comum" : "comunidades em comum"}
              </span>
            </>
          )}

          {podePedir && (
            <Button data-gc="conversa.inicio-da-dm.button"
              size="sm"
              disabled={pedir.isPending}
              onClick={() => pedir.mutate(pessoa.username)}
            >
              Enviar pedido de amizade
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
