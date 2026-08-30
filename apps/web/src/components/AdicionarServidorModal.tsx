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

/*
  Entrar num servidor e criar um servidor são a mesma vontade — "quero estar
  num lugar com meus amigos" — e antes só uma delas tinha porta.

  O "+" abria direto o formulário de criar. Quem tinha um convite na mão não
  achava onde colar: tinha que abrir o link no navegador e torcer. Agora o
  primeiro passo pergunta qual das duas é.
*/
export const AdicionarServidorModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [passo, setPasso] = useState<Passo>("escolher");

  const fechar = () => {
    setPasso("escolher");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && fechar()}>
      <DialogContent>
        {passo === "escolher" && <Escolha onEscolher={setPasso} />}
        {passo === "criar" && (
          <Criar onVoltar={() => setPasso("escolher")} onCriado={onCreated} onFechar={fechar} />
        )}
        {passo === "entrar" && <Entrar onVoltar={() => setPasso("escolher")} onFechar={fechar} />}
      </DialogContent>
    </Dialog>
  );
};

const Escolha: React.FC<{ onEscolher: (p: Passo) => void }> = ({ onEscolher }) => (
  <>
    <DialogHeader>
      <DialogTitle>Adicionar um servidor</DialogTitle>
      <DialogDescription>
        Crie um lugar novo pros seus, ou entre num que já existe.
      </DialogDescription>
    </DialogHeader>

    <DialogBody>
      <div className="grid grid-cols-2 gap-3">
        <CartaoDeEscolha
          icone={<Home size={20} />}
          titulo="Criar servidor"
          descricao="Do zero, com um canal de texto e um de voz."
          onClick={() => onEscolher("criar")}
        />
        <CartaoDeEscolha
          icone={<Link2 size={20} />}
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
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface-1 p-5 text-center transition hover:border-brand hover:bg-surface-3"
  >
    <span className="flex size-11 items-center justify-center rounded-full bg-brand text-white">
      {icone}
    </span>
    <span className="text-sm font-semibold">{titulo}</span>
    <span className="text-xs leading-relaxed text-ink-muted">{descricao}</span>
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

    /*
      A imagem sobe ANTES de criar o servidor.

      Se o envio falhar depois da criação, sobra um servidor sem ícone e uma
      pessoa achando que a criação inteira deu errado. Falhando aqui, nada foi
      criado ainda e dá pra tentar de novo sem lixo no meio.
    */
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
      <DialogHeader>
        <DialogTitle>Criar um servidor</DialogTitle>
        <DialogDescription>
          Ele já vem com um canal de texto e um de voz. Dá pra mudar tudo depois.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <div className="flex items-center gap-4">
          {/*
            Sem imagem, a inicial do nome — que muda enquanto se digita. É a
            mesma cara que o servidor vai ter na barra lateral, então a escolha
            de subir ou não uma foto é feita já vendo o resultado.
          */}
          <button
            onClick={() => seletor.current?.click()}
            className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-surface-4 bg-surface-0 text-xl font-bold text-ink-muted transition hover:border-brand hover:text-ink"
          >
            {icone ? (
              <img src={icone.previa} alt="" className="size-full object-cover" />
            ) : name.trim() ? (
              initials(name)
            ) : (
              <Upload size={20} />
            )}
          </button>

          <div className="min-w-0">
            <Button variant="surface" size="sm" onClick={() => seletor.current?.click()}>
              {icone ? "Trocar ícone" : "Enviar ícone"}
            </Button>
            <p className="mt-1.5 text-xs text-ink-faint">
              Opcional. Quadrada fica melhor, e a partir de 256px.
            </p>
          </div>

          <input
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

        <div className="mt-5">
          <Label htmlFor="guild-name">Nome do servidor</Label>
          <Input
            id="guild-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            placeholder="Ex: Gravaê"
            maxLength={64}
          />
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </div>
      </DialogBody>

      <DialogFooter>
        <Button variant="ghost" onClick={onVoltar}>
          Voltar
        </Button>
        <Button onClick={() => void submit()} disabled={ocupado}>
          {ocupado ? "Criando…" : "Criar servidor"}
        </Button>
      </DialogFooter>

      <RecorteDeImagem
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

  /*
    Aceita o link inteiro ou só o código.

    Ninguém copia "Bh1izl-3" — copia o endereço todo, do jeito que apareceu na
    conversa. Exigir só o código seria fazer a pessoa editar na mão o que ela
    acabou de colar.
  */
  const codigo = valor.trim().replace(/\/+$/, "").split("/").pop() ?? "";

  return (
    <>
      <DialogHeader>
        <DialogTitle>Entrar num servidor</DialogTitle>
        <DialogDescription>
          Cole o convite que te mandaram — o link inteiro serve.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <Label htmlFor="convite">Link ou código do convite</Label>
        <Input
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

      <DialogFooter>
        <Button variant="ghost" onClick={onVoltar}>
          Voltar
        </Button>
        <Button
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
