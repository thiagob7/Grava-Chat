import React, { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Bot,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Plus,
  Search,
  Server,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  type Permission,
} from "@gravae/shared";

import {
  useBotGuilds,
  useCreateBot,
  useDeleteBot,
  useFindBots,
  useRegenerateBotToken,
  useRemoveBotFromGuild,
  useUpdateBot,
} from "~/@core/application/queries/bot/use-bots";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import type { BotModel } from "~/@core/application/requests/bot/bots";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import { useConfirmar } from "~/components/ui/confirm";
import {
  Input,
  Label,
  Textarea,
  campoNu,
  grupoDeCampo,
} from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { copiarTexto } from "~/lib/copiar";
import { cn } from "~/lib/utils";

const AVATAR_MAX_PX = 256;

const PRESETS: { nome: string; descricao: string; permissoes: Permission[] }[] =
  [
    {
      nome: "Ler e responder",
      descricao: "O básico de um bot de comandos",
      permissoes: [
        "VIEW_CHANNEL",
        "SEND_MESSAGES",
        "READ_MESSAGE_HISTORY",
        "ADD_REACTIONS",
        "ATTACH_FILES",
      ],
    },
    {
      nome: "Música",
      descricao: "Entra no canal de voz e toca",
      permissoes: [
        "VIEW_CHANNEL",
        "SEND_MESSAGES",
        "READ_MESSAGE_HISTORY",
        "CONNECT",
        "SPEAK",
      ],
    },
    {
      nome: "Moderação",
      descricao: "Expulsa, bane e limpa mensagens",
      permissoes: [
        "VIEW_CHANNEL",
        "SEND_MESSAGES",
        "READ_MESSAGE_HISTORY",
        "MANAGE_MESSAGES",
        "KICK_MEMBERS",
        "BAN_MEMBERS",
        "MODERATE_MEMBERS",
        "VIEW_AUDIT_LOG",
      ],
    },
  ];

const copiar = (texto: string, aviso: string) =>
  void copiarTexto(texto).then((deu) =>
    deu
      ? toast.success(aviso)
      : toast.error("Seu navegador não deixou copiar."),
  );

export const BotsSection: React.FC = () => {
  const { data: bots = [], isLoading } = useFindBots(true);
  const criar = useCreateBot();
  const [nome, setNome] = useState("");
  const [tokensNovos, setTokensNovos] = useState<Record<string, string>>({});

  const guardarToken = (bot: BotModel) => {
    if (bot.token)
      setTokensNovos((atual) => ({ ...atual, [bot.id]: bot.token! }));
  };

  const criarBot = () => {
    const limpo = nome.trim();
    if (limpo.length < 2) return;

    criar.mutate(limpo, {
      onSuccess: (bot) => {
        guardarToken(bot);
        setNome("");
      },
    });
  };

  return (
    <div className="max-w-2xl pb-10">
      <p className="text-sm text-ink-muted">
        Configure aqui, mande o{" "}
        <strong className="text-ink">link de convite</strong> pra quem tem
        servidor. O código roda onde você quiser — exemplos prontos em{" "}
        <code className="rounded bg-surface-0 px-1 text-xs">exemplos/</code>.
      </p>

      <div className="mt-5 flex gap-2">
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && criarBot()}
          maxLength={32}
          placeholder="Nome do novo bot"
          aria-label="Nome do novo bot"
        />

        <Button
          onClick={criarBot}
          disabled={nome.trim().length < 2 || criar.isPending}
        >
          <Plus size={16} /> Criar
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-ink-faint">Carregando…</p>}

        {!isLoading && !bots.length && (
          <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
            <Bot size={32} className="mx-auto text-ink-faint" />
            <p className="mt-3 text-sm font-medium">Nenhum bot ainda</p>
            <p className="mt-1 text-xs text-ink-faint">
              Crie um acima. O token aparece uma vez só — guarde na hora.
            </p>
          </div>
        )}

        {bots.map((bot) => (
          <CartaoDeBot
            key={bot.id}
            bot={bot}
            tokenNovo={tokensNovos[bot.id]}
            onTokenNovo={guardarToken}
          />
        ))}
      </div>
    </div>
  );
};

type Aba = "geral" | "permissoes" | "oauth" | "servidores";

const CartaoDeBot: React.FC<{
  bot: BotModel;
  tokenNovo?: string;
  onTokenNovo: (bot: BotModel) => void;
}> = ({ bot, tokenNovo, onTokenNovo }) => {
  const salvar = useUpdateBot();
  const regenerar = useRegenerateBotToken();
  const apagar = useDeleteBot();
  const confirmar = useConfirmar();
  const servidores = useBotGuilds(bot.id);
  const enviarImagem = useUploadImage();
  const escolherFoto = useRef<HTMLInputElement>(null);

  const [aba, setAba] = useState<Aba | null>(null);
  const [descricao, setDescricao] = useState(bot.descricao ?? "");
  const [pedidas, setPedidas] = useState<Permission[]>(bot.permissoesPedidas);

  const link = `${window.location.origin}/bots/${bot.id}/adicionar`;
  const quantos = servidores.data?.length ?? 0;

  const mudou =
    descricao !== (bot.descricao ?? "") ||
    pedidas.length !== bot.permissoesPedidas.length ||
    pedidas.some((p) => !bot.permissoesPedidas.includes(p));

  const trocarFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const enviado = await enviarImagem
      .mutateAsync({ file, maxSize: AVATAR_MAX_PX, finalidade: "avatar" })
      .catch(() => null);

    if (enviado)
      salvar.mutate({
        botId: bot.id,
        dados: { avatarUrl: enviado.attachment.url },
      });
  };

  return (
    <article className="overflow-hidden rounded-lg border border-line bg-surface-2">
      <header className="flex items-center gap-3 p-4">
        <button
          onClick={() => escolherFoto.current?.click()}
          disabled={enviarImagem.isPending}
          title="Trocar a foto do bot"
          className="group relative shrink-0 rounded-full"
        >
          <Avatar
            id={bot.usuario.id}
            name={bot.usuario.displayName}
            url={bot.usuario.avatarUrl}
            size={44}
          />

          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition group-hover:opacity-100">
            <Upload size={14} className="text-white" />
          </span>
        </button>

        <input
          ref={escolherFoto}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => void trocarFoto(e)}
          className="hidden"
        />

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-semibold">
            <span className="truncate">{bot.usuario.displayName}</span>
            <span className="shrink-0 rounded bg-brand px-1.5 py-0.5 text-10 font-bold uppercase text-white">
              app
            </span>
          </p>

          <p className="truncate text-xs text-ink-faint">
            @{bot.usuario.username} ·{" "}
            {quantos === 1 ? "1 servidor" : `${quantos} servidores`}
            {!bot.publico && " · fechado"}
          </p>
        </div>

        <Button
          variant="surface"
          size="sm"
          onClick={() => copiar(link, "Link copiado.")}
        >
          <Link2 size={14} /> Convite
        </Button>

        <button
          onClick={() =>
            void confirmar({
              titulo: `Apagar ${bot.usuario.displayName}?`,
              descricao:
                "O bot sai de todos os servidores e o token para de valer. As mensagens que ele mandou também somem.",
              acao: "Apagar",
            }).then(({ confirmado }) => confirmado && apagar.mutate(bot.id))
          }
          aria-label="Apagar bot"
          title="Apagar bot"
          className="shrink-0 rounded p-1.5 text-ink-faint transition hover:bg-surface-3 hover:text-danger"
        >
          <Trash2 size={16} />
        </button>
      </header>

      {tokenNovo && (
        <div className="mx-4 mb-4 rounded border border-brand/40 bg-brand/10 p-3">
          <p className="text-xs font-semibold uppercase text-brand">
            Copie agora — este token não aparece de novo
          </p>

          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-surface-0 px-2 py-1.5 font-mono text-xs">
              {tokenNovo}
            </code>

            <Button
              variant="surface"
              size="sm"
              onClick={() => copiar(tokenNovo, "Token copiado.")}
            >
              <Copy size={14} /> Copiar
            </Button>
          </div>
        </div>
      )}

      <nav className="flex gap-1 border-t border-line px-2">
        {(["geral", "permissoes", "oauth", "servidores"] as Aba[]).map((id) => (
          <button
            key={id}
            onClick={() => setAba((atual) => (atual === id ? null : id))}
            className={cn(
              "border-b-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition",
              aba === id
                ? "border-brand text-ink"
                : "border-transparent text-ink-faint hover:text-ink-muted",
            )}
          >
            {id === "geral" && "Geral"}
            {id === "permissoes" && `Permissões · ${pedidas.length}`}
            {id === "oauth" && "OAuth2"}
            {id === "servidores" && `Servidores · ${quantos}`}
          </button>
        ))}
      </nav>

      {aba === "geral" && (
        <div className="space-y-4 border-t border-line p-4">
          <div>
            <Label htmlFor={`desc-${bot.id}`}>Descrição</Label>
            <Textarea
              id={`desc-${bot.id}`}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="O que ele faz? Aparece na tela de convite."
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Qualquer um pode adicionar</p>
              <p className="text-xs text-ink-faint">
                Desligado, só você consegue pôr esse bot num servidor.
              </p>
            </div>

            <Switch
              checked={bot.publico}
              onCheckedChange={(publico) =>
                salvar.mutate({ botId: bot.id, dados: { publico } })
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded bg-surface-0 px-3 py-2">
            <p className="min-w-0 text-xs text-ink-faint">
              O token fica só com você. Perdeu? Gere outro — o antigo morre na
              hora.
            </p>

            <Button
              variant="surface"
              size="sm"
              disabled={regenerar.isPending}
              onClick={() =>
                regenerar.mutate(bot.id, { onSuccess: onTokenNovo })
              }
            >
              <KeyRound size={14} /> Gerar outro
            </Button>
          </div>
        </div>
      )}

      {aba === "permissoes" && (
        <Permissoes escolhidas={pedidas} onMudar={setPedidas} />
      )}

      {aba === "oauth" && (
        <OAuth
          bot={bot}
          onSalvar={(uris) =>
            salvar.mutate({ botId: bot.id, dados: { redirectUris: uris } })
          }
        />
      )}

      {aba === "servidores" && <Servidores botId={bot.id} link={link} />}

      {mudou && aba !== null && (
        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-0 px-4 py-3">
          <p className="text-xs text-ink-muted">Alterações não salvas.</p>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDescricao(bot.descricao ?? "");
                setPedidas(bot.permissoesPedidas);
              }}
            >
              Descartar
            </Button>

            <Button
              size="sm"
              disabled={salvar.isPending}
              onClick={() =>
                salvar.mutate({
                  botId: bot.id,
                  dados: {
                    descricao: descricao.trim() || null,
                    permissoesPedidas: pedidas,
                  },
                })
              }
            >
              Salvar
            </Button>
          </div>
        </div>
      )}
    </article>
  );
};

const Permissoes: React.FC<{
  escolhidas: Permission[];
  onMudar: (p: Permission[]) => void;
}> = ({ escolhidas, onMudar }) => {
  const [busca, setBusca] = useState("");

  const termo = busca.toLowerCase().trim();

  const grupos = useMemo(
    () =>
      PERMISSION_GROUPS.map((grupo) => ({
        ...grupo,
        permissions: grupo.permissions.filter(
          (p) =>
            !termo ||
            (PERMISSION_LABELS[p]?.nome ?? p).toLowerCase().includes(termo),
        ),
      })).filter((g) => g.permissions.length),
    [termo],
  );

  const alternar = (permissao: Permission) =>
    onMudar(
      escolhidas.includes(permissao)
        ? escolhidas.filter((p) => p !== permissao)
        : [...escolhidas, permissao],
    );

  const igual = (preset: Permission[]) =>
    preset.length === escolhidas.length &&
    preset.every((p) => escolhidas.includes(p));

  return (
    <div className="border-t border-line p-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.nome}
            onClick={() => onMudar(preset.permissoes)}
            title={preset.descricao}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              igual(preset.permissoes)
                ? "border-brand bg-brand/15 text-ink"
                : "border-line text-ink-muted hover:border-ink-faint hover:text-ink",
            )}
          >
            {preset.nome}
          </button>
        ))}

        {escolhidas.length > 0 && (
          <button
            onClick={() => onMudar([])}
            className="rounded-full px-3 py-1 text-xs text-ink-faint transition hover:text-danger"
          >
            Limpar
          </button>
        )}
      </div>

      <div className={cn(grupoDeCampo, "mt-3")}>
        <Search size={14} className="shrink-0 text-ink-faint" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Procurar permissão"
          aria-label="Procurar permissão"
          className={campoNu}
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            aria-label="Limpar a busca"
            className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="mt-3 max-h-72 space-y-4 overflow-y-auto pr-1">
        {grupos.map((grupo) => (
          <section key={grupo.label}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {grupo.label}
            </p>

            <div className="grid gap-1 sm:grid-cols-2">
              {grupo.permissions.map((permissao) => {
                const marcada = escolhidas.includes(permissao);
                const pesada = permissao === "ADMINISTRATOR";

                return (
                  <button
                    key={permissao}
                    onClick={() => alternar(permissao)}
                    title={PERMISSION_LABELS[permissao]?.descricao}
                    className={cn(
                      "flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
                      marcada
                        ? "bg-surface-3 text-ink"
                        : "text-ink-muted hover:bg-surface-3/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border transition",
                        marcada
                          ? pesada
                            ? "border-danger bg-danger text-white"
                            : "border-brand bg-brand text-white"
                          : "border-ink-faint",
                      )}
                    >
                      {marcada && <Check size={11} strokeWidth={3} />}
                    </span>

                    <span
                      className={cn(
                        "min-w-0 truncate",
                        pesada && marcada && "text-danger",
                      )}
                    >
                      {PERMISSION_LABELS[permissao]?.nome ?? permissao}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {!grupos.length && (
          <p className="py-6 text-center text-sm text-ink-faint">
            Nenhuma permissão com esse nome.
          </p>
        )}
      </div>

      {escolhidas.includes("ADMINISTRATOR") && (
        <p className="mt-3 rounded border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-ink-muted">
          Com <strong className="text-danger">Administrador</strong>, o bot pode
          tudo — inclusive apagar canais e banir gente. Só marque se você
          escreveu o código dele.
        </p>
      )}
    </div>
  );
};

const OAuth: React.FC<{
  bot: BotModel;
  onSalvar: (uris: string[]) => void;
}> = ({ bot, onSalvar }) => {
  const [uris, setUris] = useState(bot.redirectUris.join("\n"));
  const [mostrarSegredo, setMostrarSegredo] = useState(false);

  const lista = uris
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  const mudou =
    lista.length !== bot.redirectUris.length ||
    lista.some((u, i) => u !== bot.redirectUris[i]);

  const exemplo = new URL(`${window.location.origin}/oauth2/autorizar`);
  exemplo.searchParams.set("client_id", bot.id);
  exemplo.searchParams.set(
    "redirect_uri",
    lista[0] ?? "https://seu-painel.com/callback",
  );
  exemplo.searchParams.set("scope", "identify guilds");
  exemplo.searchParams.set("state", "algo-aleatorio");

  return (
    <div className="space-y-4 border-t border-line p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label>Client ID</Label>
          <div className="flex items-center gap-1">
            <code className="min-w-0 flex-1 truncate rounded bg-surface-0 px-2 py-1.5 font-mono text-xs">
              {bot.id}
            </code>
            <button
              onClick={() => copiar(bot.id, "Client ID copiado.")}
              aria-label="Copiar o Client ID"
              className="rounded p-1.5 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        <div>
          <Label>Client Secret</Label>
          <div className="flex items-center gap-1">
            <code className="min-w-0 flex-1 truncate rounded bg-surface-0 px-2 py-1.5 font-mono text-xs">
              {mostrarSegredo ? bot.clientSecret : "•".repeat(24)}
            </code>
            <button
              onClick={() => setMostrarSegredo((v) => !v)}
              aria-label={
                mostrarSegredo ? "Esconder o segredo" : "Mostrar o segredo"
              }
              className="rounded p-1.5 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
            >
              {mostrarSegredo ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={() => copiar(bot.clientSecret, "Segredo copiado.")}
              aria-label="Copiar o segredo"
              className="rounded p-1.5 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor={`uris-${bot.id}`}>Endereços de retorno</Label>
        <Textarea
          id={`uris-${bot.id}`}
          value={uris}
          onChange={(e) => setUris(e.target.value)}
          rows={2}
          placeholder="https://seu-painel.com/callback"
          className="font-mono text-xs"
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          Um por linha. Só estes são aceitos — é o que impede outro site de pôr
          o endereço dele no link e ficar com o código.
        </p>

        {mudou && (
          <Button size="sm" className="mt-2" onClick={() => onSalvar(lista)}>
            Salvar endereços
          </Button>
        )}
      </div>

      <div>
        <Label>Link de login</Label>
        <div className="flex items-center gap-1">
          <code className="min-w-0 flex-1 truncate rounded bg-surface-0 px-2 py-1.5 font-mono text-xs text-ink-muted">
            {exemplo.toString()}
          </code>
          <button
            onClick={() => copiar(exemplo.toString(), "Link copiado.")}
            aria-label="Copiar o link de login"
            className="rounded p-1.5 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
          >
            <Copy size={14} />
          </button>
        </div>
        <p className="mt-1.5 text-xs text-ink-faint">
          Mande a pessoa para cá. Ela volta pro seu site com <code>?code=</code>
          , que você troca por um token em <code>POST /api/oauth2/token</code>.
        </p>
      </div>

      <div className="rounded bg-surface-0 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Com o token em mãos
        </p>
        <ul className="mt-1.5 space-y-1 font-mono text-xs text-ink-muted">
          <li>GET /api/oauth2/usuario — quem entrou</li>
          <li>GET /api/oauth2/servidores — onde ela está e onde manda</li>
        </ul>
        <p className="mt-2 text-xs text-ink-faint">
          Exemplo de painel completo em <code>exemplos/painel/</code>.
        </p>
      </div>
    </div>
  );
};

const Servidores: React.FC<{ botId: string; link: string }> = ({
  botId,
  link,
}) => {
  const servidores = useBotGuilds(botId);
  const remover = useRemoveBotFromGuild();

  if (!servidores.data?.length) {
    return (
      <div className="border-t border-line px-6 py-8 text-center">
        <Server size={28} className="mx-auto text-ink-faint" />
        <p className="mt-3 text-sm text-ink-muted">
          Esse bot ainda não está em nenhum servidor.
        </p>

        <Button
          variant="surface"
          size="sm"
          className="mt-3"
          onClick={() => copiar(link, "Link copiado.")}
        >
          <Link2 size={14} /> Copiar o link de convite
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1 border-t border-line p-4">
      {servidores.data.map((servidor) => (
        <div
          key={servidor.id}
          className="group flex items-center gap-2 rounded px-2 py-1.5 text-sm transition hover:bg-surface-3"
        >
          {servidor.iconUrl ? (
            <img
              src={servidor.iconUrl}
              alt=""
              className="size-6 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-4 text-10 font-bold uppercase">
              {servidor.name.slice(0, 2)}
            </span>
          )}

          <span className="min-w-0 flex-1 truncate">{servidor.name}</span>

          <button
            onClick={() => remover.mutate({ botId, guildId: servidor.id })}
            aria-label={`Tirar de ${servidor.name}`}
            title={`Tirar de ${servidor.name}`}
            className="rounded p-1 text-ink-faint opacity-0 transition hover:text-danger group-hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
