import React from "react";
import { Hand } from "lucide-react";

import { useFindCommon } from "~/@core/application/queries/user/use-find-em-comum";
import { useSendMessage } from "~/@core/application/queries/message/use-send-message";
import { useFindProfile } from "~/@core/application/queries/user/use-find-profile";
import { useRequestFriend } from "~/@core/application/queries/friend/use-request-friend";
import { Button } from "~/components/ui/button";
import { Avatar } from "~/features/perfil/components/Avatar";
import { AvatarsGroup } from "~/components/ui/grupo-de-avatares";
import { LottieArt } from "~/components/LottieArt";
import { useTranslation } from "~/traducao";
import type { PublicUser } from "@gravae/shared";

const loadWave = () =>
  import("~/assets/animations/add-friend.json").then((mod) => mod.default);

export const StartDm: React.FC<{ person: PublicUser; channelId?: string; empty?: boolean }> = ({
  person,
  channelId,
  empty = false,
}) => {
  const { t } = useTranslation();
  const { data: profile } = useFindProfile(person.id);
  const { data: inCommon } = useFindCommon(person.id, true);
  const askFor = useRequestFriend();
  const send = useSendMessage();

  const servers = inCommon?.servers ?? [];
  const canRequest = profile ? profile.friendship === "NONE" && !person.system : false;
  const canWave =
    empty && Boolean(channelId) && !person.system && profile?.friendship === "ACCEPTED";

  const wave = () => {
    if (!channelId) return;

    send.mutate({
      channelId: channelId,
      content: "👋",
      nonce: crypto.randomUUID(),
    });
  };

  return (
    <div data-gc="conversa.inicio-da-dm.div" className="flex flex-col items-center px-4 pb-8 pt-10 text-center">
      <Avatar data-gc="conversa.inicio-da-dm.avatar"
        id={person.id}
        name={person.displayName}
        url={person.avatarUrl}
        status={person.status}
        size={80}
      />

      <h2 data-gc="conversa.inicio-da-dm.h2" className="mt-4 text-2xl font-bold">{person.username}</h2>

      <p data-gc="conversa.inicio-da-dm.p" className="mt-3 text-ink-muted">
        {person.system ? (
          <>
            Esta é uma mensagem oficial da equipe do Gravaê. Não esqueça: o Gravaê nunca vai
            pedir sua senha nem o token da sua conta.
          </>
        ) : (
          <>
            Diga oi para <strong data-gc="conversa.inicio-da-dm.strong" className="font-semibold text-ink">{person.displayName}</strong>. Sua
            conversa começa aqui.
          </>
        )}
      </p>

      {(servers.length > 0 || canRequest) && (
        <div data-gc="conversa.inicio-da-dm.div--2" className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {servers.length > 0 && (
            <>
              <AvatarsGroup data-gc="conversa.inicio-da-dm.avatars-group"
                faces={servers.map((server) => ({
                  id: server.id,
                  name: server.name,
                  url: server.iconUrl,
                }))}
              />

              <span data-gc="conversa.inicio-da-dm.span" className="text-sm text-ink-muted">
                {servers.length}{" "}
                {servers.length === 1 ? "comunidade em comum" : "comunidades em comum"}
              </span>
            </>
          )}

          {canRequest && (
            <Button data-gc="conversa.inicio-da-dm.button"
              size="sm"
              disabled={askFor.isPending}
              onClick={() => askFor.mutate(person.username)}
            >
              Enviar pedido de amizade
            </Button>
          )}
        </div>
      )}

      {canWave && (
        <div data-gc="conversa.inicio-da-dm.div--3" className="mt-8 flex flex-col items-center">
          <LottieArt data-gc="conversa.inicio-da-dm.lottie-art"
            name="add-friend"
            load={loadWave}
            label={t("conversa.acenar.ilustracao")}
            className="size-32"
          />

          <Button data-gc="conversa.inicio-da-dm.button.wave"
            className="mt-4"
            disabled={send.isPending}
            onClick={wave}
          >
            <Hand data-gc="conversa.inicio-da-dm.hand" size={16} />
            {t("conversa.acenar.botao", { nome: person.displayName })}
          </Button>
        </div>
      )}
    </div>
  );
};
