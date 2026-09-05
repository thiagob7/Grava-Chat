import React, { useRef, useState } from "react";
import { ImageUp, Upload, X } from "lucide-react";
import { LIMITS } from "@gravae/shared";

import { importarImagem } from "~/@core/application/requests/upload/importar-imagem";
import { useEnvioDeImagemDePerfil } from "~/features/perfil/hooks/use-envio-de-imagem-de-perfil";
import { SeletorDeImagem } from "~/components/SeletorDeImagem";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { Input, Label, Textarea } from "~/components/ui/input";
import { CampoDeCor } from "~/features/configuracoes/components/perfil/campos";
import type { RascunhoDePerfil } from "~/features/configuracoes/components/perfil/rascunho";
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
    <div data-gc="configuracoes.perfil.identidade-aba.div" className="space-y-6">
      <div data-gc="configuracoes.perfil.identidade-aba.div--2" className="flex items-center gap-4">
        <Avatar data-gc="configuracoes.perfil.identidade-aba.avatar"
          id={id}
          name={rascunho.displayName}
          url={rascunho.avatarUrl}
          size={72}
          enfeites={{ decoracao: rascunho.decoracao, moldura: rascunho.moldura }}
          animar
        />

        <div data-gc="configuracoes.perfil.identidade-aba.div--3">
          <Button data-gc="configuracoes.perfil.identidade-aba.button"
            variant="surface"
            size="sm"
            onClick={() => escolherFoto.current?.click()}
            disabled={enviando}
          >
            <Upload data-gc="configuracoes.perfil.identidade-aba.upload" size={14} />
            {enviando ? "Enviando…" : "Trocar foto"}
          </Button>

          <p data-gc="configuracoes.perfil.identidade-aba.p" className="mt-1.5 text-xs text-ink-faint">
            {economia
              ? `Comprimida antes de subir: ${economia}`
              : "A imagem é reduzida no navegador antes de subir."}
          </p>

          <input data-gc="configuracoes.perfil.identidade-aba.input"
            ref={escolherFoto}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => void enviar(e, "avatarUrl")}
            className="hidden"
          />
        </div>
      </div>

      <div data-gc="configuracoes.perfil.identidade-aba.div--4">
        <Label data-gc="configuracoes.perfil.identidade-aba.label" htmlFor="display-name">Nome de exibição</Label>
        <Input data-gc="configuracoes.perfil.identidade-aba.input--2"
          id="display-name"
          value={rascunho.displayName}
          onChange={(e) => definir("displayName", e.target.value)}
          maxLength={LIMITS.displayName}
        />
      </div>

      <div data-gc="configuracoes.perfil.identidade-aba.div--5">
        <Label data-gc="configuracoes.perfil.identidade-aba.label--2" htmlFor="username">Nome de usuário</Label>
        <Input data-gc="configuracoes.perfil.identidade-aba.input--3" id="username" value={`@${username}`} readOnly className="text-ink-faint" />
        <p data-gc="configuracoes.perfil.identidade-aba.p--2" className="mt-1 text-xs text-ink-faint">
          É por aqui que seus amigos te encontram. Ainda não dá pra trocar.
        </p>
      </div>

      <div data-gc="configuracoes.perfil.identidade-aba.div--6">
        <Label data-gc="configuracoes.perfil.identidade-aba.label--3" htmlFor="bio">Sobre mim</Label>
        <Textarea data-gc="configuracoes.perfil.identidade-aba.textarea"
          id="bio"
          value={rascunho.bio}
          onChange={(e) => definir("bio", e.target.value)}
          maxLength={512}
          rows={3}
          placeholder="Conte algo sobre você"
        />
      </div>

      <div data-gc="configuracoes.perfil.identidade-aba.div--7" className="h-px bg-line" />

      <div data-gc="configuracoes.perfil.identidade-aba.div--8">
        <Label data-gc="configuracoes.perfil.identidade-aba.label--4">Faixa do cartão</Label>
        <div data-gc="configuracoes.perfil.identidade-aba.div--9" className="flex items-center gap-2">
          <Button data-gc="configuracoes.perfil.identidade-aba.button--2"
            variant="surface"
            size="sm"
            onClick={() => setEscolhendoFaixa(true)}
            disabled={enviando || importando}
          >
            <ImageUp data-gc="configuracoes.perfil.identidade-aba.image-up" size={14} />
            {importando ? "Trazendo o GIF…" : "Escolher imagem ou GIF"}
          </Button>

          {rascunho.bannerUrl && (
            <Button data-gc="configuracoes.perfil.identidade-aba.button--3" variant="ghost" size="sm" onClick={() => definir("bannerUrl", null)}>
              <X data-gc="configuracoes.perfil.identidade-aba.x" size={14} /> Tirar
            </Button>
          )}
        </div>

        <input data-gc="configuracoes.perfil.identidade-aba.input--4"
          ref={escolherBanner}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => void enviar(e, "bannerUrl")}
          className="hidden"
        />

        <p data-gc="configuracoes.perfil.identidade-aba.p--3" className="mt-1.5 text-xs text-ink-faint">
          PNG, JPG ou GIF até {Math.round(LIMITS.bannerBytes / 1024 / 1024)} MB. Sem imagem, vale a
          cor abaixo.
        </p>
      </div>

      <SeletorDeImagem data-gc="configuracoes.perfil.identidade-aba.seletor-de-imagem"
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

      <CampoDeCor data-gc="configuracoes.perfil.identidade-aba.campo-de-cor"
        label="Cor da faixa"
        valor={rascunho.bannerCor}
        onMudar={(cor) => definir("bannerCor", cor)}
        dica="Usada quando não há imagem. Sem escolha, fica a cor gerada do seu id."
      />

      <div data-gc="configuracoes.perfil.identidade-aba.div--10" className="grid grid-cols-2 gap-4">
        <CampoDeCor data-gc="configuracoes.perfil.identidade-aba.campo-de-cor--2"
          label="Tema — cor 1"
          valor={rascunho.temaPrimario}
          onMudar={(cor) => definir("temaPrimario", cor)}
        />
        <CampoDeCor data-gc="configuracoes.perfil.identidade-aba.campo-de-cor--3"
          label="Tema — cor 2"
          valor={rascunho.temaSecundario}
          onMudar={(cor) => definir("temaSecundario", cor)}
          dica="Com as duas, o corpo do cartão vira um degradê."
        />
      </div>
    </div>
  );
};
