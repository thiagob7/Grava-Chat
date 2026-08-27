import React, { useRef, useState } from "react";
import { ImageUp, Upload, X } from "lucide-react";
import { LIMITS } from "@gravae/shared";

import { importarImagem } from "~/@core/application/requests/upload/importar-imagem";
import { useEnvioDeImagemDePerfil } from "~/hooks/use-envio-de-imagem-de-perfil";
import { SeletorDeImagem } from "~/components/SeletorDeImagem";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import { Input, Label, Textarea } from "~/components/ui/input";
import { CampoDeCor } from "~/components/user-settings/perfil/campos";
import type { RascunhoDePerfil } from "~/components/user-settings/perfil/rascunho";
import { toast } from "react-toastify";

interface IdentidadeAbaProps {
  id: string;
  username: string;
  rascunho: RascunhoDePerfil;
  definir: <K extends keyof RascunhoDePerfil>(campo: K, valor: RascunhoDePerfil[K]) => void;
}

export const IdentidadeAba: React.FC<IdentidadeAbaProps> = ({ id, username, rascunho, definir }) => {
  const { enviar, economia, enviando } = useEnvioDeImagemDePerfil((campo, url) =>
    definir(campo, url),
  );
  const escolherFoto = useRef<HTMLInputElement>(null);
  const escolherBanner = useRef<HTMLInputElement>(null);
  const [escolhendoFaixa, setEscolhendoFaixa] = useState(false);
  const [importando, setImportando] = useState(false);

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
            disabled={enviando}
          >
            <Upload size={14} />
            {enviando ? "Enviando…" : "Trocar foto"}
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
        <Textarea
          id="bio"
          value={rascunho.bio}
          onChange={(e) => definir("bio", e.target.value)}
          maxLength={512}
          rows={3}
          placeholder="Conte algo sobre você"
        />
      </div>

      <div className="h-px bg-line" />

      <div>
        <Label>Faixa do cartão</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="surface"
            size="sm"
            onClick={() => setEscolhendoFaixa(true)}
            disabled={enviando || importando}
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
