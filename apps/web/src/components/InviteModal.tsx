import React, { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { useCreateInvite } from "~/@core/application/queries/guild/use-create-invite";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

interface InviteModalProps {
  open: boolean;
  guildId: string | undefined;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ open, guildId, onClose }) => {
  const createInvite = useCreateInvite();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutateAsync } = createInvite;

  useEffect(() => {
    if (!open || !guildId) return;

    setLink(null);
    setCopied(false);

    void mutateAsync({ guildId })
      .then((invite) => setLink(`${window.location.origin}/invite/${invite.code}`))
      .catch(() => undefined);
  }, [open, guildId, mutateAsync]);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar amigos</DialogTitle>
          <DialogDescription>Mande este link para quem você quer no servidor.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="flex items-center gap-2 rounded bg-surface-0 p-1 pl-3">
            <Input readOnly value={link ?? "Gerando…"} className="bg-transparent px-0" />
            <Button onClick={() => void copy()} disabled={!link} size="md">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
