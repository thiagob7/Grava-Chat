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
import { useConfirm } from "~/components/ui/confirm";
import { Input, Label, Textarea } from "~/components/ui/input";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Choice } from "~/features/configuracoes/components/campos-de-config";
import {
  SectionContext,
  ConfigSection as Section,
} from "~/features/configuracoes/components/SecaoDeConfig";
import { SecretField } from "~/features/configuracoes/components/aplicativos/comum";
import { InviteBuilder } from "~/features/configuracoes/components/aplicativos/ConstrutorDeConvite";
import { ServersSection } from "~/features/configuracoes/components/aplicativos/SecaoDeServidores";
import { StoreSection } from "~/features/configuracoes/components/aplicativos/SecaoDaLoja";
import { useTranslation } from "~/traducao";

const AVATAR_MAX_PX = 256;

interface AppPropsDetail {
  bot: BotModel;
  onBack: () => void;
  onTokenNew: (token: string) => void;
}

export const AppDetail: React.FC<AppPropsDetail> = ({
  bot,
  onBack,
  onTokenNew,
}) => {
  const { t } = useTranslation();
  const save = useUpdateBot();
  const regenerate = useRegenerateBotToken();
  const doDelete = useDeleteBot();
  const confirm = useConfirm();
  const sendImage = useUploadImage();
  const pickPhoto = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(bot.user.displayName);
  const [description, setDescription] = useState(bot.description ?? "");
  const [requested, setRequested] = useState<Permission[]>(bot.permissionsRequested);
  const [uris, setUris] = useState(bot.redirectUris.join("\n"));
  const [coverUrl, setCoverUrl] = useState(bot.coverUrl ?? null);
  const [categories, setCategories] = useState<string[]>(bot.categories ?? []);
  const [languages, setLanguages] = useState<string[]>(bot.languages ?? []);
  const [terms, setTerms] = useState(bot.termsUrl ?? "");
  const [policy, setPolicy] = useState(bot.policyUrl ?? "");
  const [support, setSupport] = useState(bot.supportServerId ?? null);

  const link = `${window.location.origin}/bots/${bot.id}/adicionar`;

  const listUris = uris
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  const changed =
    name.trim() !== bot.user.displayName ||
    description !== (bot.description ?? "") ||
    requested.length !== bot.permissionsRequested.length ||
    requested.some((p) => !bot.permissionsRequested.includes(p)) ||
    listUris.length !== bot.redirectUris.length ||
    listUris.some((u, i) => u !== bot.redirectUris[i]) ||
    coverUrl !== (bot.coverUrl ?? null) ||
    categories.join(",") !== (bot.categories ?? []).join(",") ||
    languages.join(",") !== (bot.languages ?? []).join(",") ||
    terms !== (bot.termsUrl ?? "") ||
    policy !== (bot.policyUrl ?? "") ||
    support !== (bot.supportServerId ?? null);

  const discard = () => {
    setName(bot.user.displayName);
    setDescription(bot.description ?? "");
    setRequested(bot.permissionsRequested);
    setUris(bot.redirectUris.join("\n"));
    setCoverUrl(bot.coverUrl ?? null);
    setCategories(bot.categories ?? []);
    setLanguages(bot.languages ?? []);
    setTerms(bot.termsUrl ?? "");
    setPolicy(bot.policyUrl ?? "");
    setSupport(bot.supportServerId ?? null);
  };

  const swapPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const sent = await sendImage
      .mutateAsync({ file, maxSize: AVATAR_MAX_PX, purpose: "avatar" })
      .catch(() => null);

    if (sent)
      save.mutate({ botId: bot.id, data: { avatarUrl: sent.attachment.url } });
  };

  const linkDeLogin = (withBot = false) => {
    const address = new URL(`${window.location.origin}/oauth2/autorizar`);
    address.searchParams.set("client_id", bot.id);
    address.searchParams.set(
      "redirect_uri",
      listUris[0] ?? "https://seu-painel.com/callback",
    );
    address.searchParams.set("scope", withBot ? "identify email guilds connections bot" : "identify guilds");
    address.searchParams.set("state", "algo-aleatorio");
    return address.toString();
  };

  return (
    <SectionContext.Provider value={null}>
      <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div" className="max-w-2xl pb-10">
        <Breadcrumb data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb">
          <BreadcrumbList data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb-list">
            <BreadcrumbItem data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb-item">
              <BreadcrumbLink data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb-link" asChild>
                <button data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.button.on-back" type="button" onClick={onBack}>
                  Aplicativos
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb-separator" />

            <BreadcrumbItem data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb-item--2">
              <BreadcrumbPage data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.breadcrumb-page">{bot.user.displayName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.header" className="mt-5 flex items-center gap-3">
          <button data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.button"
            type="button"
            onClick={() => pickPhoto.current?.click()}
            disabled={sendImage.isPending}
            title="Trocar a foto do bot"
            className="group relative shrink-0 rounded-full"
          >
            <Avatar data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.avatar"
              id={bot.user.id}
              name={bot.user.displayName}
              url={bot.user.avatarUrl}
              size={56}
            />

            <span data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.span" className="absolute inset-0 flex items-center justify-center rounded-full bg-sobre-midia opacity-0 transition group-hover:opacity-100">
              <Upload data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.upload" size={16} className="text-sobre-marca" />
            </span>
          </button>

          <input data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.input"
            ref={pickPhoto}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => void swapPhoto(e)}
            className="hidden"
          />

          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--2" className="min-w-0 flex-1">
            <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p" className="flex items-center gap-2">
              <span data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.span--2" className="truncate text-lg font-semibold">
                {bot.user.displayName}
              </span>
              <span data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.span--3" className="shrink-0 rounded bg-brand px-1.5 py-0.5 text-10 font-bold uppercase text-sobre-marca">
                app
              </span>
            </p>

            <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--2" className="truncate text-xs text-ink-faint">@{bot.user.username}</p>
          </div>
        </header>

        <Section data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.section"
          id="credenciais"
          title="Credenciais"
          detail="Quem tem isso é o bot. Não ponha num repositório público."
        >
          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--3">
            <Label data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.label">Client ID</Label>
            <SecretField data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.secret-field"
              value={bot.id}
              labelCopy="Copiar o Client ID"
              noticeCopied="Client ID copiado."
            />
          </div>

          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--4" className="mt-4">
            <Label data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.label--2">Client Secret</Label>
            <SecretField data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.secret-field--2"
              value={bot.clientSecret}
              labelCopy="Copiar o segredo"
              noticeCopied="Segredo copiado."
              hideable
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
              disabled={regenerate.isPending}
              onClick={() =>
                void confirm({
                  title: "Gerar outro token?",
                  description:
                    "O token de agora para de valer na hora. Todo código que usa ele precisa ser atualizado.",
                  action: "Gerar outro",
                }).then(
                  ({ confirmed }) =>
                    confirmed &&
                    regenerate.mutate(bot.id, {
                      onSuccess: (fresh) => fresh.token && onTokenNew(fresh.token),
                    }),
                )
              }
            >
              <KeyRound data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.key-round" size={16} /> Gerar outro
            </Button>
          </div>
        </Section>

        <Section data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.section--2"
          id="informacoes"
          title="Informações"
          detail="É o que aparece pra quem for adicionar o bot."
        >
          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--7">
            <Label data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.label--3" htmlFor={`nome-${bot.id}`}>Nome</Label>
            <Input data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.input--2"
              id={`nome-${bot.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
            />
          </div>

          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--8" className="mt-4">
            <Label data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.label--4" htmlFor={`desc-${bot.id}`}>Descrição</Label>
            <Textarea data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.textarea"
              id={`desc-${bot.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="O que ele faz? Aparece na tela de convite."
            />
          </div>

          <Choice data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.choice"
            title="Qualquer um pode adicionar"
            detail="Desligado, só você consegue pôr esse bot num servidor."
            on={bot.isPublic}
            onChange={(isPublic) => save.mutate({ botId: bot.id, data: { isPublic } })}
          />
        </Section>

        <Section data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.section--3"
          id="loja"
          title={t("servidor.descoberta.lojaTitulo")}
          detail={t("servidor.descoberta.lojaDetalhe")}
        >
          <StoreSection data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.store-section.set-cover-url"
            botId={bot.id}
            name={name.trim() || bot.user.displayName}
            avatarUrl={bot.user.avatarUrl}
            onIcon={(url) => save.mutate({ botId: bot.id, data: { avatarUrl: url } })}
            coverUrl={coverUrl}
            categories={categories}
            languages={languages}
            termsUrl={terms}
            policyUrl={policy}
            supportServerId={support}
            onCover={setCoverUrl}
            onCategories={setCategories}
            onLanguages={setLanguages}
            onTerms={setTerms}
            onPolicy={setPolicy}
            onSupportServer={setSupport}
          />
        </Section>

        <Section data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.section--4"
          id="convite"
          title="Convite"
          detail="O link já leva as permissões marcadas aqui."
        >
          <InviteBuilder data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.invite-builder.set-requested" link={link} picked={requested} onChange={setRequested} />
        </Section>

        <Section data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.section--5"
          id="oauth2"
          title="OAuth2"
          detail="Pra montar um painel externo que entra com a conta do Gravaê."
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
            <SecretField data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.secret-field--3"
              value={linkDeLogin()}
              labelCopy="Copiar o link de login"
              noticeCopied="Link copiado."
              mono={false}
            />
            <Label data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.label--7" className="mt-4">Link de login com o bot</Label>
            <SecretField data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.secret-field--4"
              value={linkDeLogin(true)}
              labelCopy="Copiar o link com o bot"
              noticeCopied="Link copiado."
              mono={false}
            />
            <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--6" className="mt-1.5 text-xs text-ink-faint">
              Este pede também o e-mail, as conexões e o bot: a pessoa escolhe as permissões e a comunidade onde ele entra.
            </p>

            <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--7" className="mt-1.5 text-xs text-ink-faint">
              Mande a pessoa para cá. Ela volta pro seu site com <code data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.code">?code=</code>, que
              você troca por um token em <code data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.code--2">POST /api/oauth2/token</code>.
            </p>
          </div>

          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--11" className="mt-4 rounded-lg border border-line bg-surface-2 p-3">
            <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--8" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Com o token em mãos
            </p>
            <ul data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.ul" className="mt-1.5 space-y-1 font-mono text-xs text-ink-muted">
              <li data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.li">GET /api/oauth2/usuario — quem entrou</li>
              <li data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.li--2">GET /api/oauth2/servidores — onde ela está e onde manda</li>
            </ul>
            <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--9" className="mt-2 text-xs text-ink-faint">
              Exemplo de painel completo em <code data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.code--3">exemplos/painel/</code>.
            </p>
          </div>
        </Section>

        <Section data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.section--6" id="servidores" title="Servidores" detail="Onde esse bot está agora.">
          <ServersSection data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.servers-section" botId={bot.id} link={link} />
        </Section>

        <Section data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.section--7"
          id="apagar-aplicativo"
          title="Apagar o aplicativo"
          detail="Não dá pra desfazer."
        >
          <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--12" className="flex items-start gap-4">
            <div data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.div--13" className="min-w-0 flex-1">
              <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--10" className="text-sm font-medium">Apagar {bot.user.displayName}</p>
              <p data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.p--11" className="mt-0.5 text-xs text-ink-faint">
                O bot sai de todos os servidores, o token para de valer e as
                mensagens que ele mandou somem.
              </p>
            </div>

            <Button data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.button--3"
              variant="danger"
              onClick={() =>
                void confirm({
                  title: `Apagar ${bot.user.displayName}?`,
                  description:
                    "O bot sai de todos os servidores e o token para de valer. As mensagens que ele mandou também somem.",
                  action: "Apagar",
                }).then(({ confirmed }) => {
                  if (!confirmed) return;
                  doDelete.mutate(bot.id, { onSuccess: onBack });
                })
              }
            >
              <Trash2 data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.trash2" size={16} /> Apagar
            </Button>
          </div>
        </Section>

        <UnsavedBar data-gc="configuracoes.aplicativos.detalhe-do-aplicativo.unsaved-bar.discard"
          visible={changed}
          saving={save.isPending}
          onDiscard={discard}
          onSave={() =>
            save.mutate({
              botId: bot.id,
              data: {
                name: name.trim(),
                description: description.trim() || null,
                permissionsRequested: requested,
                redirectUris: listUris,
                coverUrl,
                categories,
                languages,
                termsUrl: terms.trim() || null,
                policyUrl: policy.trim() || null,
                supportServerId: support,
              },
            })
          }
        />
      </div>
    </SectionContext.Provider>
  );
};
