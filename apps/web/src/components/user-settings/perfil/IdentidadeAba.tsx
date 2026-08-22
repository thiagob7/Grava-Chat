import React, { useRef, useState } from "react";
import { ImageUp, Upload, X } from "lucide-react";
import { LIMITS } from "@gravae/shared";

import { importarImagem } from "~/@core/application/requests/upload/importar-imagem";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { SeletorDeImagem } from "~/components/SeletorDeImagem";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import { Input, Label, campoBase } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { CampoDeCor } from "~/components/user-settings/perfil/campos";
import type { RascunhoDePerfil } from "~/components/user-settings/perfil/rascunho";
import { formatBytes } from "~/lib/image";
import { toast } from "react-toastify";

/** O avatar aparece no máximo a 72px; 256 cobre tela retina com folga. */
const AVATAR_MAX_PX = 256;
/** O banner ocupa a largura do cartão, que é estreito: 640 já é generoso. */
const BANNER_MAX_PX = 640;

interface IdentidadeAbaProps {
  id: string;
  username: string;
  rascunho: RascunhoDePerfil;
  definir: <K extends keyof RascunhoDePerfil>(campo: K, valor: RascunhoDePerfil[K]) => void;
}

/**
 * Quem você é: nome, foto, bio, e a faixa e as cores do seu cartão.
 *
 * Separado dos enfeites porque são decisões de natureza diferente — aqui é
 * conteúdo, ali é adorno — e porque a lista inteira numa aba só vira uma
 * rolagem em que ninguém acha nada.
 */
export const IdentidadeAba: React.FC<IdentidadeAbaProps> = ({ id, username, rascunho, definir }) => {
  const uploadImage = useUploadImage();
  const escolherFoto = useRef<HTMLInputElement>(null);
  const escolherBanner = useRef<HTMLInputElement>(null);
  const [economia, setEconomia] = useState<string | null>(null);
  const [escolhendoFaixa, setEscolhendoFaixa] = useState(false);
  const [importando, setImportando] = useState(false);

  const enviar = async (
    event: React.ChangeEvent<HTMLInputElement>,
    campo: "avatarUrl" | "bannerUrl",
  ) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!file) return;

    const foto = campo === "avatarUrl";
    const resultado = await uploadImage
      .mutateAsync({
        file,
        maxSize: foto ? AVATAR_MAX_PX : BANNER_MAX_PX,
        // é isto que troca o teto de 50 MB de anexo pelo teto da finalidade
        finalidade: foto ? "avatar" : "banner",
      })
      .catch(() => null);

    if (!resultado) return;

    definir(campo, resultado.attachment.url);
    setEconomia(
      resultado.uploadedSize < resultado.originalSize
        ? `${formatBytes(resultado.originalSize)} → ${formatBytes(resultado.uploadedSize)}`
        : null,
    );
  };

  /**
   * O GIF vem do CDN do provedor, e todo endereço que gravamos no perfil tem
   * que ser do nosso bucket — é o que impede um `bannerUrl` externo de virar
   * pixel de rastreamento carregado por quem abre o cartão. Quem baixa e guarda
   * é o servidor: pelo navegador dependeria de CORS no CDN, que não existe.
   */
  const usarGif = async (url: string) => {
    setImportando(true);
    const anexo = await importarImagem(url, "banner")
      .catch(() => {
        toast.error("Não consegui trazer esse GIF.");
        return null;
      })
      .finally(() => setImportando(false));

    if (anexo) definir("bannerUrl", anexo.url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar
          id={id}
          name={rascunho.displayName}
          url={rascunho.avatarUrl}
          size={72}
          enfeites={{ decoracao: rascunho.decoracao, moldura: rascunho.moldura }}
          animar
        />

        <div>
          <Button
            variant="surface"
            size="sm"
            onClick={() => escolherFoto.current?.click()}
            disabled={uploadImage.isPending}
          >
            <Upload size={14} />
            {uploadImage.isPending ? "Enviando…" : "Trocar foto"}
          </Button>

          <p className="mt-1.5 text-xs text-ink-faint">
            {economia
              ? `Comprimida antes de subir: ${economia}`
              : "A imagem é reduzida no navegador antes de subir."}
          </p>

          <input
            ref={escolherFoto}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => void enviar(e, "avatarUrl")}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="display-name">Nome de exibição</Label>
        <Input
          id="display-name"
          value={rascunho.displayName}
          onChange={(e) => definir("displayName", e.target.value)}
          maxLength={LIMITS.displayName}
        />
      </div>

      <div>
        <Label htmlFor="username">Nome de usuário</Label>
        <Input id="username" value={`@${username}`} readOnly className="text-ink-faint" />
        <p className="mt-1 text-xs text-ink-faint">
          É por aqui que seus amigos te encontram. Ainda não dá pra trocar.
        </p>
      </div>

      <div>
        <Label htmlFor="bio">Sobre mim</Label>
        <textarea
          id="bio"
          value={rascunho.bio}
          onChange={(e) => definir("bio", e.target.value)}
          maxLength={512}
          rows={3}
          placeholder="Conte algo sobre você"
          className={cn(campoBase, "resize-none")}
        />
      </div>

      <div className="h-px bg-line" />

      <div>
        <Label>Faixa do cartão</Label>
        <div className="flex items-center gap-2">
          {/*
            Abre o seletor, e não a janela de arquivos: ir direto pro sistema
            escondia que dá pra usar um GIF, e quem quisesse um teria que baixar
            primeiro pra depois subir.
          */}
          <Button
            variant="surface"
            size="sm"
            onClick={() => setEscolhendoFaixa(true)}
            disabled={uploadImage.isPending || importando}
          >
            <ImageUp size={14} />
            {importando ? "Trazendo o GIF…" : "Escolher imagem ou GIF"}
          </Button>

          {rascunho.bannerUrl && (
            <Button variant="ghost" size="sm" onClick={() => definir("bannerUrl", null)}>
              <X size={14} /> Tirar
            </Button>
          )}
        </div>

        <input
          ref={escolherBanner}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => void enviar(e, "bannerUrl")}
          className="hidden"
        />

        <p className="mt-1.5 text-xs text-ink-faint">
          PNG, JPG ou GIF até {Math.round(LIMITS.bannerBytes / 1024 / 1024)} MB. Sem imagem, vale a
          cor abaixo.
        </p>
      </div>

      <SeletorDeImagem
        open={escolhendoFaixa}
        onClose={() => setEscolhendoFaixa(false)}
        onArquivo={() => {
          setEscolhendoFaixa(false);
          escolherBanner.current?.click();
        }}
        onGif={(gif) => void usarGif(gif.url)}
        titulo="Faixa do perfil"
        rodape={`PNG, JPG ou GIF até ${Math.round(LIMITS.bannerBytes / 1024 / 1024)} MB. O GIF continua animado — ele não passa pelo redimensionador.`}
      />

      <CampoDeCor
        label="Cor da faixa"
        valor={rascunho.bannerCor}
        onMudar={(cor) => definir("bannerCor", cor)}
        dica="Usada quando não há imagem. Sem escolha, fica a cor gerada do seu id."
      />

      <div className="grid grid-cols-2 gap-4">
        <CampoDeCor
          label="Tema — cor 1"
          valor={rascunho.temaPrimario}
          onMudar={(cor) => definir("temaPrimario", cor)}
        />
        <CampoDeCor
          label="Tema — cor 2"
          valor={rascunho.temaSecundario}
          onMudar={(cor) => definir("temaSecundario", cor)}
          dica="Com as duas, o corpo do cartão vira um degradê."
        />
      </div>
    </div>
  );
};
