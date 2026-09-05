import React, { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Home, Link2, Upload } from "lucide-react";

import { useCreateGuild } from "~/@core/application/queries/guild/use-create-guild";
import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { RecorteDeImagem } from "~/components/RecorteDeImagem";
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

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (guildId: string) => void;
}

type Passo = "escolher" | "criar" | "entrar";

export const AdicionarServidorModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [passo, setPasso] = useState<Passo>("escolher");

  const fechar = () => {
    setPasso("escolher");
    onClose();
  };

  return (
    <Dialog data-gc="servidor.adicionar-servidor-modal.dialog" open={open} onOpenChange={(v) => !v && fechar()}>
      <DialogContent data-gc="servidor.adicionar-servidor-modal.dialog-content">
        {passo === "escolher" && <Escolha data-gc="servidor.adicionar-servidor-modal.escolha.set-passo" onEscolher={setPasso} />}
        {passo === "criar" && (
          <Criar data-gc="servidor.adicionar-servidor-modal.criar.on-created" onVoltar={() => setPasso("escolher")} onCriado={onCreated} onFechar={fechar} />
        )}
        {passo === "entrar" && <Entrar data-gc="servidor.adicionar-servidor-modal.entrar.fechar" onVoltar={() => setPasso("escolher")} onFechar={fechar} />}
      </DialogContent>
    </Dialog>
  );
};

const Escolha: React.FC<{ onEscolher: (p: Passo) => void }> = ({ onEscolher }) => (
  <>
    <DialogHeader data-gc="servidor.adicionar-servidor-modal.dialog-header">
      <DialogTitle data-gc="servidor.adicionar-servidor-modal.dialog-title">Adicionar um servidor</DialogTitle>
      <DialogDescription data-gc="servidor.adicionar-servidor-modal.dialog-description">
        Crie um lugar novo pros seus, ou entre num que já existe.
      </DialogDescription>
    </DialogHeader>

    <DialogBody data-gc="servidor.adicionar-servidor-modal.dialog-body">
      <div data-gc="servidor.adicionar-servidor-modal.div" className="grid grid-cols-2 gap-3">
        <CartaoDeEscolha data-gc="servidor.adicionar-servidor-modal.cartao-de-escolha"
          icone={<Home data-gc="servidor.adicionar-servidor-modal.home" size={20} />}
          titulo="Criar servidor"
          descricao="Do zero, com um canal de texto e um de voz."
          onClick={() => onEscolher("criar")}
        />
        <CartaoDeEscolha data-gc="servidor.adicionar-servidor-modal.cartao-de-escolha--2"
          icone={<Link2 data-gc="servidor.adicionar-servidor-modal.link2" size={20} />}
          titulo="Entrar com convite"
          descricao="Cole o link ou o código que te mandaram."
          onClick={() => onEscolher("entrar")}
        />
      </div>
    </DialogBody>
  </>
);

const CartaoDeEscolha: React.FC<{
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  onClick: () => void;
}> = ({ icone, titulo, descricao, onClick }) => (
  <button data-gc="servidor.adicionar-servidor-modal.button.on-click"
    onClick={onClick}
    className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface-1 p-5 text-center transition hover:border-brand hover:bg-surface-3"
  >
    <span data-gc="servidor.adicionar-servidor-modal.span" className="flex size-11 items-center justify-center rounded-full bg-brand text-white">
      {icone}
    </span>
    <span data-gc="servidor.adicionar-servidor-modal.span--2" className="text-sm font-semibold">{titulo}</span>
    <span data-gc="servidor.adicionar-servidor-modal.span--3" className="text-xs leading-relaxed text-ink-muted">{descricao}</span>
  </button>
);

const Criar: React.FC<{
  onVoltar: () => void;
  onCriado: (guildId: string) => void;
  onFechar: () => void;
}> = ({ onVoltar, onCriado, onFechar }) => {
  const createGuild = useCreateGuild();
  const updateGuild = useUpdateGuild();
  const uploadImage = useUploadImage();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [paraRecortar, setParaRecortar] = useState<File | null>(null);
  const [icone, setIcone] = useState<{ arquivo: File; previa: string } | null>(null);
  const seletor = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (name.trim().length < 2) return setError("O nome precisa de pelo menos 2 caracteres");
    setError(null);

    const enviado = icone
      ? await uploadImage
          .mutateAsync({ file: icone.arquivo, maxSize: 256, finalidade: "avatar" })
          .catch(() => null)
      : null;

    if (icone && !enviado) return;

    const guild = await createGuild.mutateAsync({ name: name.trim() }).catch(() => null);
    if (!guild) return;

    if (enviado) {
      await updateGuild
        .mutateAsync({ guildId: guild.id, iconUrl: enviado.attachment.url })
        .catch(() => undefined);
    }

    onFechar();
    onCriado(guild.id);
  };

  const ocupado = createGuild.isPending || uploadImage.isPending;

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
          <button data-gc="servidor.adicionar-servidor-modal.button"
            onClick={() => seletor.current?.click()}
            className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-surface-4 bg-surface-0 text-xl font-bold text-ink-muted transition hover:border-brand hover:text-ink"
          >
            {icone ? (
              <img data-gc="servidor.adicionar-servidor-modal.img" src={icone.previa} alt="" className="size-full object-cover" />
            ) : name.trim() ? (
              initials(name)
            ) : (
              <Upload data-gc="servidor.adicionar-servidor-modal.upload" size={20} />
            )}
          </button>

          <div data-gc="servidor.adicionar-servidor-modal.div--3" className="min-w-0">
            <Button data-gc="servidor.adicionar-servidor-modal.button--2" variant="surface" size="sm" onClick={() => seletor.current?.click()}>
              {icone ? "Trocar ícone" : "Enviar ícone"}
            </Button>
            <p data-gc="servidor.adicionar-servidor-modal.p" className="mt-1.5 text-xs text-ink-faint">
              Opcional. Quadrada fica melhor, e a partir de 256px.
            </p>
          </div>

          <input data-gc="servidor.adicionar-servidor-modal.input"
            ref={seletor}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              e.target.value = "";
              if (arquivo) setParaRecortar(arquivo);
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
        <Button data-gc="servidor.adicionar-servidor-modal.button.on-voltar" variant="ghost" onClick={onVoltar}>
          Voltar
        </Button>
        <Button data-gc="servidor.adicionar-servidor-modal.button--3" onClick={() => void submit()} disabled={ocupado}>
          {ocupado ? "Criando…" : "Criar servidor"}
        </Button>
      </DialogFooter>

      <RecorteDeImagem data-gc="servidor.adicionar-servidor-modal.recorte-de-imagem"
        arquivo={paraRecortar}
        onCancelar={() => setParaRecortar(null)}
        onPronto={(recortado) => {
          setParaRecortar(null);
          setIcone({ arquivo: recortado, previa: URL.createObjectURL(recortado) });
        }}
      />
    </>
  );
};

const Entrar: React.FC<{ onVoltar: () => void; onFechar: () => void }> = ({
  onVoltar,
  onFechar,
}) => {
  const navigate = useNavigate();
  const [valor, setValor] = useState("");

  const codigo = valor.trim().replace(/\/+$/, "").split("/").pop() ?? "";

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
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || !codigo) return;
            onFechar();
            navigate(`/invite/${codigo}`);
          }}
          placeholder="https://gravae-chat.vercel.app/invite/abc123"
        />
      </DialogBody>

      <DialogFooter data-gc="servidor.adicionar-servidor-modal.dialog-footer--2">
        <Button data-gc="servidor.adicionar-servidor-modal.button.on-voltar--2" variant="ghost" onClick={onVoltar}>
          Voltar
        </Button>
        <Button data-gc="servidor.adicionar-servidor-modal.button--4"
          disabled={!codigo}
          onClick={() => {
            onFechar();
            navigate(`/invite/${codigo}`);
          }}
        >
          Ver convite
        </Button>
      </DialogFooter>
    </>
  );
};
