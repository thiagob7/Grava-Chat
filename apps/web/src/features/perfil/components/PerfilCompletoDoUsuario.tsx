import React from "react";

import { useFindProfile } from "~/@core/application/queries/user/use-find-profile";
import { FullProfileModal } from "~/features/perfil/components/FullProfileModal";

/*
  O perfil completo de alguém, aberto de qualquer lista.

  A consulta só sai quando `open` vira verdade. Numa lista de cem amigos, pedir
  o perfil de cada linha para poder desenhá-la seriam cem pedidos para ninguém
  ver — e o cartão da lista já tem tudo o que a linha mostra.
*/
export const UserFullProfile: React.FC<{
  userId: string;
  open: boolean;
  onClose: () => void;
}> = ({ userId, open, onClose }) => {
  const { data: profile } = useFindProfile(open ? userId : null);

  if (!open || !profile) return null;

  return <FullProfileModal data-gc="perfil.perfil-completo-do-usuario.full-profile-modal.on-close" open profile={profile} onClose={onClose} />;
};
