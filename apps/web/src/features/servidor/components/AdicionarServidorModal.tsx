import React, { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Home, Link2, Plus, Upload } from "lucide-react";

import { useCreateGuild } from "~/@core/application/queries/guild/use-create-guild";
import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { ImageEditor } from "~/components/EditorDeImagem";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input, Label } from "~/components/ui/input";
import { initials } from "~/lib/format";
import { cn } from "~/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (guildId: string) => void;
}

type Step = "escolher" | "criar" | "entrar";

export const AddServerModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [step, setStep] = useState<Step>("escolher");

  const close = () => {
    setStep("escolher");
    onClose();
  };

  return (
    <Dialog data-gc="servidor.adicionar-servidor-modal.dialog" open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent data-gc="servidor.adicionar-servidor-modal.dialog-content">
        {step === "escolher" && <Selection data-gc="servidor.adicionar-servidor-modal.selection.set-step" onPick={setStep} />}
        {step === "criar" && (
          <Create data-gc="servidor.adicionar-servidor-modal.create.on-created" onBack={() => setStep("escolher")} onCreated={onCreated} onClose={close} />
        )}
        {step === "entrar" && <Join data-gc="servidor.adicionar-servidor-modal.join.close" onBack={() => setStep("escolher")} onClose={close} />}
      </DialogContent>
    </Dialog>
  );
};

const Selection: React.FC<{ onPick: (p: Step) => void }> = ({ onPick }) => (
  <>
    <DialogHeader data-gc="servidor.adicionar-servidor-modal.dialog-header">
      <DialogTitle data-gc="servidor.adicionar-servidor-modal.dialog-title">Adicionar um servidor</DialogTitle>
      <DialogDescription data-gc="servidor.adicionar-servidor-modal.dialog-description">
        Crie um lugar novo pros seus, ou entre num que já existe.
      </DialogDescription>
    </DialogHeader>

    <DialogBody data-gc="servidor.adicionar-servidor-modal.dialog-body">
      <div data-gc="servidor.adicionar-servidor-modal.div" className="grid grid-cols-2 gap-3">
        <ChoiceCard data-gc="servidor.adicionar-servidor-modal.choice-card"
          icon={<Home data-gc="servidor.adicionar-servidor-modal.home" size={20} />}
          title="Criar servidor"
          description="Do zero, com um canal de texto e um de voz."
          onClick={() => onPick("criar")}
        />
        <ChoiceCard data-gc="servidor.adicionar-servidor-modal.choice-card--2"
          icon={<Link2 data-gc="servidor.adicionar-servidor-modal.link2" size={20} />}
          title="Entrar com convite"
          description="Cole o link ou o código que te mandaram."
          onClick={() => onPick("entrar")}
        />
      </div>
    </DialogBody>
  </>
);

const ChoiceCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
  <button data-gc="servidor.adicionar-servidor-modal.button.on-click"
    onClick={onClick}
    className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface-1 p-5 text-center transition hover:border-brand hover:bg-surface-3"
  >
    <span data-gc="servidor.adicionar-servidor-modal.span" className="flex size-11 items-center justify-center rounded-full bg-brand text-sobre-marca">
      {icon}
    </span>
    <span data-gc="servidor.adicionar-servidor-modal.span--2" className="text-sm font-semibold">{title}</span>
    <span data-gc="servidor.adicionar-servidor-modal.span--3" className="text-xs leading-relaxed text-ink-muted">{description}</span>
  </button>
);

const Create: React.FC<{
  onBack: () => void;
  onCreated: (guildId: string) => void;
  onClose: () => void;
}> = ({ onBack, onCreated, onClose }) => {
  const createGuild = useCreateGuild();
  const updateGuild = useUpdateGuild();
  const uploadImage = useUploadImage();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forCrop, setForCrop] = useState<File | null>(null);
  const [icon, setIcon] = useState<{ file: File; preview: string } | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (name.trim().length < 2) return setError("O nome precisa de pelo menos 2 caracteres");
    setError(null);

    const sent = icon
      ? await uploadImage
          .mutateAsync({ file: icon.file, maxSize: 256, purpose: "avatar" })
          .catch(() => null)
      : null;

    if (icon && !sent) return;

    const guild = await createGuild.mutateAsync({ name: name.trim() }).catch(() => null);
    if (!guild) return;

    if (sent) {
      await updateGuild
        .mutateAsync({ guildId: guild.id, iconUrl: sent.attachment.url })
        .catch(() => undefined);
    }

    onClose();
    onCreated(guild.id);
  };

  const busy = createGuild.isPending || uploadImage.isPending;

  return (
    <>
      <DialogHeader data-gc="servidor.adicionar-servidor-modal.dialog-header--2">
        <DialogTitle data-gc="servidor.adicionar-servidor-modal.dialog-title--2">Criar um servidor</DialogTitle>
        <DialogDescription data-gc="servidor.adicionar-servidor-modal.dialog-description--2">
          Ele já vem com um canal de texto e um de voz. Dá pra mudar tudo depois.
        </DialogDescription>
      </DialogHeader>

      <DialogBody data-gc="servidor.adicionar-servidor-modal.dialog-body--2">
        <div data-gc="servidor.adicionar-servidor-modal.div--2" className="flex items-center gap-4">
          {/*
            O disco fica um degrau acima do fundo do modal, senão o tracejado
            flutua no vazio e não se lê como lugar de soltar imagem. A bolinha
            com o mais só aparece enquanto não há ícone.
          */}
          <button data-gc="servidor.adicionar-servidor-modal.button"
            onClick={() => picker.current?.click()}
            aria-label={icon ? "Trocar ícone do servidor" : "Enviar ícone do servidor"}
            className="group/icone relative size-20 shrink-0 rounded-full transition focus-visible:outline-none"
          >
            <span data-gc="servidor.adicionar-servidor-modal.span--4"
              className={cn(
                "flex size-full items-center justify-center overflow-hidden rounded-full bg-surface-3 text-xl font-bold text-ink-muted transition",
                "group-hover/icone:bg-surface-4 group-hover/icone:text-ink",
                icon
                  ? "border-2 border-line-sutil"
                  : "border-2 border-dashed border-line group-hover/icone:border-brand",
              )}
            >
              {icon ? (
                <img data-gc="servidor.adicionar-servidor-modal.img" src={icon.preview} alt="" className="size-full object-cover" />
              ) : name.trim() ? (
                initials(name)
              ) : (
                <Upload data-gc="servidor.adicionar-servidor-modal.upload" size={20} />
              )}
            </span>

            {!icon && (
              <span data-gc="servidor.adicionar-servidor-modal.span--5"
                aria-hidden
                className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full bg-brand text-sobre-marca ring-2 ring-surface-1"
              >
                <Plus data-gc="servidor.adicionar-servidor-modal.plus" size={14} strokeWidth={3} />
              </span>
            )}
          </button>

          <div data-gc="servidor.adicionar-servidor-modal.div--3" className="min-w-0">
            <Button data-gc="servidor.adicionar-servidor-modal.button--2" variant="surface" size="sm" onClick={() => picker.current?.click()}>
              {icon ? "Trocar ícone" : "Enviar ícone"}
            </Button>
            <p data-gc="servidor.adicionar-servidor-modal.p" className="mt-1.5 text-xs text-ink-faint">
              Opcional. Quadrada fica melhor, e a partir de 256px.
            </p>
          </div>

          <input data-gc="servidor.adicionar-servidor-modal.input"
            ref={picker}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) setForCrop(file);
            }}
          />
        </div>

        <div data-gc="servidor.adicionar-servidor-modal.div--4" className="mt-5">
          <Label data-gc="servidor.adicionar-servidor-modal.label" htmlFor="guild-name">Nome do servidor</Label>
          <Input data-gc="servidor.adicionar-servidor-modal.input--2"
            id="guild-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            placeholder="Ex: Gravaê"
            maxLength={64}
          />
          {error && <p data-gc="servidor.adicionar-servidor-modal.p--2" className="mt-2 text-sm text-danger">{error}</p>}
        </div>
      </DialogBody>

      <DialogFooter data-gc="servidor.adicionar-servidor-modal.dialog-footer">
        <Button data-gc="servidor.adicionar-servidor-modal.button.on-back" variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button data-gc="servidor.adicionar-servidor-modal.button--3" onClick={() => void submit()} disabled={busy}>
          {busy ? "Criando…" : "Criar servidor"}
        </Button>
      </DialogFooter>

      <ImageEditor data-gc="servidor.adicionar-servidor-modal.image-editor"
        file={forCrop}
        aspect={1}
        exportWidth={256}
        mime="image/webp"
        round
        onCancel={() => setForCrop(null)}
        onApply={(cropped) => {
          setForCrop(null);
          setIcon({ file: cropped, preview: URL.createObjectURL(cropped) });
        }}
      />
    </>
  );
};

const Join: React.FC<{ onBack: () => void; onClose: () => void }> = ({
  onBack,
  onClose,
}) => {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const code = value.trim().replace(/\/+$/, "").split("/").pop() ?? "";

  return (
    <>
      <DialogHeader data-gc="servidor.adicionar-servidor-modal.dialog-header--3">
        <DialogTitle data-gc="servidor.adicionar-servidor-modal.dialog-title--3">Entrar num servidor</DialogTitle>
        <DialogDescription data-gc="servidor.adicionar-servidor-modal.dialog-description--3">
          Cole o convite que te mandaram — o link inteiro serve.
        </DialogDescription>
      </DialogHeader>

      <DialogBody data-gc="servidor.adicionar-servidor-modal.dialog-body--3">
        <Label data-gc="servidor.adicionar-servidor-modal.label--2" htmlFor="convite">Link ou código do convite</Label>
        <Input data-gc="servidor.adicionar-servidor-modal.input--3"
          id="convite"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || !code) return;
            onClose();
            navigate(`/invite/${code}`);
          }}
          placeholder="https://gravae-chat.vercel.app/invite/abc123"
        />
      </DialogBody>

      <DialogFooter data-gc="servidor.adicionar-servidor-modal.dialog-footer--2">
        <Button data-gc="servidor.adicionar-servidor-modal.button.on-back--2" variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button data-gc="servidor.adicionar-servidor-modal.button--4"
          disabled={!code}
          onClick={() => {
            onClose();
            navigate(`/invite/${code}`);
          }}
        >
          Ver convite
        </Button>
      </DialogFooter>
    </>
  );
};
