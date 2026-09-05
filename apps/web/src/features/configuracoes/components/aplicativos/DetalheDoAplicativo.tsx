import React, { useRef, useState } from "react";
import { KeyRound, Trash2, Upload } from "lucide-react";
import type { Permission } from "@gravae/shared";

import {
  useDeleteBot,
  useRegenerateBotToken,
  useUpdateBot,
} from "~/@core/application/queries/bot/use-bots";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import type { BotModel } from "~/@core/application/requests/bot/bots";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { useConfirmar } from "~/components/ui/confirm";
import { Input, Label, Textarea } from "~/components/ui/input";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Opcao } from "~/features/configuracoes/components/campos-de-config";
import {
  ContextoDaSecao,
  SecaoDeConfig as Secao,
} from "~/features/configuracoes/components/SecaoDeConfig";
import { CampoDeSegredo } from "~/features/configuracoes/components/aplicativos/comum";
import { ConstrutorDeConvite } from "~/features/configuracoes/components/aplicativos/ConstrutorDeConvite";
import { SecaoDeServidores } from "~/features/configuracoes/components/aplicativos/SecaoDeServidores";

const AVATAR_MAX_PX = 256;

interface DetalheDoAplicativoProps {
  bot: BotModel;
  onVoltar: () => void;
  onTokenNovo: (token: string) => void;
}

export const DetalheDoAplicativo: React.FC<DetalheDoAplicativoProps> = ({
  bot,
  onVoltar,
  onTokenNovo,
}) => {
  const salvar = useUpdateBot();
  const regenerar = useRegenerateBotToken();
  const apagar = useDeleteBot();
  const confirmar = useConfirmar();
  const enviarImagem = useUploadImage();
  const escolherFoto = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(bot.usuario.displayName);
  const [descricao, setDescricao] = useState(bot.descricao ?? "");
  const [pedidas, setPedidas] = useState<Permission[]>(bot.permissoesPedidas);
  const [uris, setUris] = useState(bot.redirectUris.join("\n"));

  const link = `${window.location.origin}/bots/${bot.id}/adicionar`;

  const listaDeUris = uris
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  const mudou =
    nome.trim() !== bot.usuario.displayName ||
    descricao !== (bot.descricao ?? "") ||
    pedidas.length !== bot.permissoesPedidas.length ||
    pedidas.some((p) => !bot.permissoesPedidas.includes(p)) ||
    listaDeUris.length !== bot.redirectUris.length ||
    listaDeUris.some((u, i) => u !== bot.redirectUris[i]);

  const descartar = () => {
    setNome(bot.usuario.displayName);
    setDescricao(bot.descricao ?? "");
    setPedidas(bot.permissoesPedidas);
    setUris(bot.redirectUris.join("\n"));
  };

  const trocarFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const enviado = await enviarImagem
      .mutateAsync({ file, maxSize: AVATAR_MAX_PX, finalidade: "avatar" })
      .catch(() => null);

    if (enviado)
      salvar.mutate({ botId: bot.id, dados: { avatarUrl: enviado.attachment.url } });
  };

  const linkDeLogin = () => {
    const endereco = new URL(`${window.location.origin}/oauth2/autorizar`);
    endereco.searchParams.set("client_id", bot.id);
    endereco.searchParams.set(
      "redirect_uri",
      listaDeUris[0] ?? "https://seu-painel.com/callback",
    );
    endereco.searchParams.set("scope", "identify guilds");
    endereco.searchParams.set("state", "algo-aleatorio");
    return endereco.toString();
  };

  return (
    <ContextoDaSecao.Provider value={null}>
      <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div" className="max-w-2xl pb-10">
        <Breadcrumb data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb">
          <BreadcrumbList data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb-list">
            <BreadcrumbItem data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb-item">
              <BreadcrumbLink data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb-link" asChild>
                <button data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.button.on-voltar" type="button" onClick={onVoltar}>
                  Aplicativos
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb-separator" />

            <BreadcrumbItem data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb-item--2">
              <BreadcrumbPage data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb-page">{bot.usuario.displayName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.header" className="mt-5 flex items-center gap-3">
          <button data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.button"
            type="button"
            onClick={() => escolherFoto.current?.click()}
            disabled={enviarImagem.isPending}
            title="Trocar a foto do bot"
            className="group relative shrink-0 rounded-full"
          >
            <Avatar data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.avatar"
              id={bot.usuario.id}
              name={bot.usuario.displayName}
              url={bot.usuario.avatarUrl}
              size={56}
            />

            <span data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.span" className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition group-hover:opacity-100">
              <Upload data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.upload" size={16} className="text-white" />
            </span>
          </button>

          <input data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.input"
            ref={escolherFoto}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => void trocarFoto(e)}
            className="hidden"
          />

          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--2" className="min-w-0 flex-1">
            <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p" className="flex items-center gap-2">
              <span data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.span--2" className="truncate text-lg font-semibold">
                {bot.usuario.displayName}
              </span>
              <span data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.span--3" className="shrink-0 rounded bg-brand px-1.5 py-0.5 text-10 font-bold uppercase text-white">
                app
              </span>
            </p>

            <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--2" className="truncate text-xs text-ink-faint">@{bot.usuario.username}</p>
          </div>
        </header>

        <Secao data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.secao"
          id="credenciais"
          titulo="Credenciais"
          detalhe="Quem tem isso é o bot. Não ponha num repositório público."
        >
          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--3">
            <Label data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.label">Client ID</Label>
            <CampoDeSegredo data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.campo-de-segredo"
              valor={bot.id}
              rotuloCopiar="Copiar o Client ID"
              avisoCopiado="Client ID copiado."
            />
          </div>

          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--4" className="mt-4">
            <Label data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.label--2">Client Secret</Label>
            <CampoDeSegredo data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.campo-de-segredo--2"
              valor={bot.clientSecret}
              rotuloCopiar="Copiar o segredo"
              avisoCopiado="Segredo copiado."
              escondivel
            />
          </div>

          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--5" className="mt-4 flex items-start gap-4">
            <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--6" className="min-w-0 flex-1">
              <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--3" className="text-sm font-medium">Token do bot</p>
              <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--4" className="mt-0.5 text-xs text-ink-faint">
                Aparece uma vez só, na hora em que é gerado. Perdeu? Gere outro
                — o antigo morre na hora.
              </p>
            </div>

            <Button data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.button--2"
              variant="surface"
              disabled={regenerar.isPending}
              onClick={() =>
                void confirmar({
                  titulo: "Gerar outro token?",
                  descricao:
                    "O token de agora para de valer na hora. Todo código que usa ele precisa ser atualizado.",
                  acao: "Gerar outro",
                }).then(
                  ({ confirmado }) =>
                    confirmado &&
                    regenerar.mutate(bot.id, {
                      onSuccess: (novo) => novo.token && onTokenNovo(novo.token),
                    }),
                )
              }
            >
              <KeyRound data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.key-round" size={16} /> Gerar outro
            </Button>
          </div>
        </Secao>

        <Secao data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.secao--2"
          id="informacoes"
          titulo="Informações"
          detalhe="É o que aparece pra quem for adicionar o bot."
        >
          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--7">
            <Label data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.label--3" htmlFor={`nome-${bot.id}`}>Nome</Label>
            <Input data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.input--2"
              id={`nome-${bot.id}`}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={32}
            />
          </div>

          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--8" className="mt-4">
            <Label data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.label--4" htmlFor={`desc-${bot.id}`}>Descrição</Label>
            <Textarea data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.textarea"
              id={`desc-${bot.id}`}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="O que ele faz? Aparece na tela de convite."
            />
          </div>

          <Opcao data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.opcao"
            titulo="Qualquer um pode adicionar"
            detalhe="Desligado, só você consegue pôr esse bot num servidor."
            ligado={bot.publico}
            onMudar={(publico) => salvar.mutate({ botId: bot.id, dados: { publico } })}
          />
        </Secao>

        <Secao data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.secao--3"
          id="convite"
          titulo="Convite"
          detalhe="O link já leva as permissões marcadas aqui."
        >
          <ConstrutorDeConvite data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.construtor-de-convite.set-pedidas" link={link} escolhidas={pedidas} onMudar={setPedidas} />
        </Secao>

        <Secao data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.secao--4"
          id="oauth2"
          titulo="OAuth2"
          detalhe="Pra montar um painel externo que entra com a conta do Gravaê."
        >
          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--9">
            <Label data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.label--5" htmlFor={`uris-${bot.id}`}>Endereços de retorno</Label>
            <Textarea data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.textarea--2"
              id={`uris-${bot.id}`}
              value={uris}
              onChange={(e) => setUris(e.target.value)}
              rows={2}
              placeholder="https://seu-painel.com/callback"
              className="font-mono text-xs"
            />
            <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--5" className="mt-1.5 text-xs text-ink-faint">
              Um por linha. Só estes são aceitos — é o que impede outro site de
              pôr o endereço dele no link e ficar com o código.
            </p>
          </div>

          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--10" className="mt-4">
            <Label data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.label--6">Link de login</Label>
            <CampoDeSegredo data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.campo-de-segredo--3"
              valor={linkDeLogin()}
              rotuloCopiar="Copiar o link de login"
              avisoCopiado="Link copiado."
              mono={false}
            />
            <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--6" className="mt-1.5 text-xs text-ink-faint">
              Mande a pessoa para cá. Ela volta pro seu site com <code data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.code">?code=</code>, que
              você troca por um token em <code data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.code--2">POST /api/oauth2/token</code>.
            </p>
          </div>

          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--11" className="mt-4 rounded-lg border border-line bg-surface-2 p-3">
            <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--7" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Com o token em mãos
            </p>
            <ul data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.ul" className="mt-1.5 space-y-1 font-mono text-xs text-ink-muted">
              <li data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.li">GET /api/oauth2/usuario — quem entrou</li>
              <li data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.li--2">GET /api/oauth2/servidores — onde ela está e onde manda</li>
            </ul>
            <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--8" className="mt-2 text-xs text-ink-faint">
              Exemplo de painel completo em <code data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.code--3">exemplos/painel/</code>.
            </p>
          </div>
        </Secao>

        <Secao data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.secao--5" id="servidores" titulo="Servidores" detalhe="Onde esse bot está agora.">
          <SecaoDeServidores data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.secao-de-servidores" botId={bot.id} link={link} />
        </Secao>

        <Secao data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.secao--6"
          id="apagar-aplicativo"
          titulo="Apagar o aplicativo"
          detalhe="Não dá pra desfazer."
        >
          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--12" className="flex items-start gap-4">
            <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--13" className="min-w-0 flex-1">
              <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--9" className="text-sm font-medium">Apagar {bot.usuario.displayName}</p>
              <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--10" className="mt-0.5 text-xs text-ink-faint">
                O bot sai de todos os servidores, o token para de valer e as
                mensagens que ele mandou somem.
              </p>
            </div>

            <Button data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.button--3"
              variant="danger"
              onClick={() =>
                void confirmar({
                  titulo: `Apagar ${bot.usuario.displayName}?`,
                  descricao:
                    "O bot sai de todos os servidores e o token para de valer. As mensagens que ele mandou também somem.",
                  acao: "Apagar",
                }).then(({ confirmado }) => {
                  if (!confirmado) return;
                  apagar.mutate(bot.id, { onSuccess: onVoltar });
                })
              }
            >
              <Trash2 data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.trash2" size={16} /> Apagar
            </Button>
          </div>
        </Secao>

        <UnsavedBar data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.unsaved-bar.descartar"
          visivel={mudou}
          salvando={salvar.isPending}
          onDescartar={descartar}
          onSalvar={() =>
            salvar.mutate({
              botId: bot.id,
              dados: {
                nome: nome.trim(),
                descricao: descricao.trim() || null,
                permissoesPedidas: pedidas,
                redirectUris: listaDeUris,
              },
            })
          }
        />
      </div>
    </ContextoDaSecao.Provider>
  );
};
