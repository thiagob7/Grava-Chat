import React, { useState } from "react";
import {
  Bell,
  BellOff,
  Bookmark,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  Gamepad2,
  Heart,
  Music,
  Settings,
  Shield,
  Star,
  Ungroup,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { VozNoServidor } from "@gravae/shared";

import { useMarcarServidorLido } from "~/@core/application/queries/guild/use-marcar-servidor-lido";
import type { GuildSummaryModel } from "~/@core/domain/models/guild-model";
import { Button } from "~/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input, Label, campoDeCor } from "~/components/ui/input";
import { CampoSelect } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Tooltip } from "~/components/ui/tooltip";
import {
  ItemDoServidor,
  MarcaDeSoltar,
  TIPO_DE_ARRASTO,
  zonaDoPonteiro,
  type ZonaDeSoltar,
} from "~/features/servidor/components/ItemDoServidor";
import { ICONES_DE_PASTA, type Destino, type IconeDaPasta, type Pasta } from "~/features/servidor/lib/trilho";
import { usePastas } from "~/features/servidor/stores/pastas";
import { servidorSilenciado, useAvisos, type ModoDoCanal } from "~/stores/notificacoes";
import { cn } from "~/lib/utils";

const DESENHOS: Record<IconeDaPasta, React.ComponentType<{ size?: number; className?: string }>> = {
  pasta: Folder,
  estrela: Star,
  coracao: Heart,
  salvar: Bookmark,
  jogo: Gamepad2,
  escudo: Shield,
  nota: Music,
};

const MINUTO = 60_000;
const DURACOES: { chave: string; ms: number }[] = [
  { chave: "porQuinze", ms: 15 * MINUTO },
  { chave: "porMeiaHora", ms: 30 * MINUTO },
  { chave: "porUmaHora", ms: 60 * MINUTO },
  { chave: "porTresHoras", ms: 3 * 60 * MINUTO },
  { chave: "porOitoHoras", ms: 8 * 60 * MINUTO },
  { chave: "porUmDia", ms: 24 * 60 * MINUTO },
  { chave: "porTresDias", ms: 3 * 24 * 60 * MINUTO },
  { chave: "ateReativar", ms: -1 },
];

const Marca: React.FC<{ ligado: boolean }> = ({ ligado }) => (
  <Check data-gc="servidor.pasta-do-trilho.check" size={14} className={ligado ? "text-brand" : "opacity-0"} />
);

interface PastaDoTrilhoProps {
  pasta: Pasta;
  guilds: GuildSummaryModel[];
  activeGuildId: string | null;
  porServidor: Record<string, { naoLidas?: number; mencoes?: number }>;
  vozes: Record<string, VozNoServidor[]>;
  onSelect: (guildId: string) => void;
  onConvidar: (guildId: string) => void;
  onSoltar: (guildId: string, destino: Destino) => void;
}

/*
  A pasta do trilho: fechada, um quadrado com os servidores dentro — ou o
  ícone escolhido; aberta, uma coluna com todos eles, sobre um fundo com a
  cor da pasta. Clicar alterna.

  O botão direito manda em todas as comunidades de dentro de uma vez: marcar
  como lidas, silenciar, o modo de aviso, esconder os canais silenciados. É a
  mesma decisão do menu de um servidor, aplicada ao grupo.
*/
export const PastaDoTrilho: React.FC<PastaDoTrilhoProps> = ({
  pasta,
  guilds,
  activeGuildId,
  porServidor,
  vozes,
  onSelect,
  onConvidar,
  onSoltar,
}) => {
  const { t } = useTranslation();
  const alternar = usePastas((s) => s.alternar);
  const desfazer = usePastas((s) => s.desfazer);
  const marcarLido = useMarcarServidorLido();
  const definirServidor = useAvisos((s) => s.definirServidor);
  const prefs = useAvisos((s) => s.porServidor);
  const [zona, setZona] = useState<ZonaDeSoltar>(null);
  const [configurando, setConfigurando] = useState(false);

  const ids = guilds.map((g) => g.id);
  const ativa = guilds.some((g) => g.id === activeGuildId);
  const naoLidas = guilds.reduce((n, g) => n + (porServidor[g.id]?.naoLidas ?? 0), 0);
  const mencoes = guilds.reduce((n, g) => n + (porServidor[g.id]?.mencoes ?? 0), 0);
  const nome = pasta.nome || guilds.map((g) => g.name).join(", ");
  const cor = pasta.cor ?? "var(--color-brand)";
  const Desenho = DESENHOS[pasta.icone ?? "pasta"];

  /// Silenciada quando todas as de dentro estão: uma só falando já é barulho.
  const silenciada = guilds.every((g) => servidorSilenciado({ porServidor: prefs }, g.id));
  const modoEmComum = (() => {
    const modos = new Set(ids.map((id) => prefs[id]?.modo ?? null));
    return modos.size === 1 ? [...modos][0] : undefined;
  })();
  const escondendo = ids.every((id) => prefs[id]?.esconderSilenciados);

  const paraTodas = (mudanca: Parameters<typeof definirServidor>[1]) =>
    ids.forEach((id) => definirServidor(id, mudanca));

  const arrastando = (e: React.DragEvent<HTMLElement>) => e.dataTransfer.types.includes(TIPO_DE_ARRASTO);

  const modos: { modo: ModoDoCanal | null; chave: string }[] = [
    { modo: "tudo", chave: "todas" },
    { modo: "mencoes", chave: "soMencoes" },
    { modo: "nada", chave: "nada" },
  ];

  const capa = (
    <button data-gc="servidor.pasta-do-trilho.button"
      type="button"
      onClick={() => alternar(pasta.id)}
      aria-label={nome}
      aria-expanded={pasta.aberta}
      className={cn(
        "flex size-[var(--guild-icon-size)] items-center justify-center overflow-hidden rounded-2xl transition-all duration-200 ease-out active:translate-y-px active:scale-95",
        pasta.aberta ? "bg-transparent" : "bg-surface-0 hover:bg-surface-3",
        zona === "juntar" && "ring-2 ring-brand ring-offset-2 ring-offset-surface-1",
      )}
      style={{ color: cor }}
    >
      {pasta.aberta || pasta.mostrarIconeMinimizado ? (
        pasta.aberta ? (
          <FolderOpen data-gc="servidor.pasta-do-trilho.folder-open" size={22} />
        ) : (
          <Desenho data-gc="servidor.pasta-do-trilho.desenho" size={22} />
        )
      ) : (
        <span data-gc="servidor.pasta-do-trilho.span" className="grid size-9 grid-cols-2 gap-1">
          {guilds.slice(0, 4).map((g) => (
            <span data-gc="servidor.pasta-do-trilho.span--2" key={g.id} className="size-4 overflow-hidden rounded-full bg-surface-3 text-[8px] font-bold leading-4 text-ink">
              {g.iconUrl ? <img data-gc="servidor.pasta-do-trilho.img" src={g.iconUrl} alt="" draggable={false} className="size-full object-cover" /> : g.name.slice(0, 1)}
            </span>
          ))}
        </span>
      )}
    </button>
  );

  return (
    <>
      <ContextMenu data-gc="servidor.pasta-do-trilho.context-menu">
        <ContextMenuTrigger data-gc="servidor.pasta-do-trilho.context-menu-trigger" asChild>
          <div data-gc="servidor.pasta-do-trilho.div"
            className={cn("group relative flex w-full flex-col items-center", pasta.aberta && "py-1.5")}
            onDragOver={(e) => {
              if (!arrastando(e)) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setZona(pasta.aberta ? "juntar" : zonaDoPonteiro(e));
            }}
            onDragLeave={() => setZona(null)}
            onDrop={(e) => {
              const arrastado = e.dataTransfer.getData(TIPO_DE_ARRASTO);
              const z = pasta.aberta ? "juntar" : zonaDoPonteiro(e);
              setZona(null);
              if (!arrastado) return;
              e.preventDefault();
              e.stopPropagation();

              if (z === "juntar") onSoltar(arrastado, { tipo: "pasta", pastaId: pasta.id });
              else onSoltar(arrastado, { tipo: z === "antes" ? "antes" : "depois", de: `pasta:${pasta.id}` });
            }}
          >
            {/*
              O fundo é uma camada atrás, recuada das bordas — e não o fundo do
              próprio bloco. A pasta ganha respiro nas laterais sem levar junto a
              pílula de servidor ativo, que mora colada na borda do trilho.
            */}
            {pasta.aberta && (
              <span data-gc="servidor.pasta-do-trilho.span--3"
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-1.5 right-1.5 rounded-2xl"
                style={{ backgroundColor: `color-mix(in oklab, ${cor}, transparent 88%)` }}
              />
            )}

            <MarcaDeSoltar data-gc="servidor.pasta-do-trilho.marca-de-soltar" zona={zona} />

            <div data-gc="servidor.pasta-do-trilho.div--2" className="relative flex w-full justify-center">
              <span data-gc="servidor.pasta-do-trilho.span--4"
                className={cn(
                  "absolute left-0 top-1/2 w-1 -translate-y-1/2 transition-all",
                  ativa && !pasta.aberta ? "h-10" : naoLidas > 0 && !pasta.aberta && !silenciada ? "h-2 group-hover:h-5" : "h-0 group-hover:h-5",
                )}
              >
                <span data-gc="servidor.pasta-do-trilho.span--5" className="block size-full rounded-r-full bg-pilula" />
              </span>

              <Tooltip data-gc="servidor.pasta-do-trilho.tooltip" side="right" label={nome}>{capa}</Tooltip>

              {mencoes > 0 && !pasta.aberta && (
                <span data-gc="servidor.pasta-do-trilho.span--6" className="pointer-events-none absolute bottom-0 right-3 flex min-w-[20px] items-center justify-center rounded-full border-2 border-surface-1 bg-danger px-1 text-11 font-bold leading-4 text-sobre-marca">
                  {mencoes > 99 ? "99+" : mencoes}
                </span>
              )}
            </div>

            {pasta.aberta && (
              <div data-gc="servidor.pasta-do-trilho.div--3" className="mt-2 flex w-full flex-col items-center gap-2">
                {guilds.map((guild) => (
                  <ItemDoServidor data-gc="servidor.pasta-do-trilho.item-do-servidor.on-select"
                    key={guild.id}
                    guild={guild}
                    active={guild.id === activeGuildId}
                    naoLidas={porServidor[guild.id]?.naoLidas ?? 0}
                    mencoes={porServidor[guild.id]?.mencoes ?? 0}
                    vozes={vozes[guild.id] ?? []}
                    onSelect={onSelect}
                    onConvidar={() => onConvidar(guild.id)}
                    onSoltar={onSoltar}
                    pastaId={pasta.id}
                  />
                ))}
              </div>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent data-gc="servidor.pasta-do-trilho.context-menu-content">
          <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item" onSelect={() => ids.forEach((id) => marcarLido.mutate(id))}>
            {t("servidor.pasta.marcarLida")} <Eye data-gc="servidor.pasta-do-trilho.eye" size={14} />
          </ContextMenuItem>

          <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator" />

          <ContextMenuSub data-gc="servidor.pasta-do-trilho.context-menu-sub">
            <ContextMenuSubTrigger data-gc="servidor.pasta-do-trilho.context-menu-sub-trigger">
              {t("servidor.pasta.silenciarTodas")} <BellOff data-gc="servidor.pasta-do-trilho.bell-off" size={14} />
            </ContextMenuSubTrigger>
            <ContextMenuSubContent data-gc="servidor.pasta-do-trilho.context-menu-sub-content">
              {DURACOES.map((d) => (
                <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--2"
                  key={d.chave}
                  onSelect={() => paraTodas({ silenciadoAte: d.ms === -1 ? -1 : Date.now() + d.ms })}
                >
                  {t(`servidor.menu.${d.chave}`)}
                </ContextMenuItem>
              ))}

              <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator--2" />

              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--3" onSelect={() => paraTodas({ silenciadoAte: null })}>
                {t("servidor.pasta.reativarTodas")} <Marca data-gc="servidor.pasta-do-trilho.marca" ligado={!silenciada} />
              </ContextMenuItem>

              <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator--3" />

              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--4" onSelect={() => paraTodas({ esconderSilenciados: true })}>
                {t("servidor.menu.ocultarSilenciados")} <Marca data-gc="servidor.pasta-do-trilho.marca--2" ligado={escondendo} />
              </ContextMenuItem>
              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--5" onSelect={() => paraTodas({ esconderSilenciados: false })}>
                {t("servidor.pasta.mostrarSilenciados")} <Marca data-gc="servidor.pasta-do-trilho.marca--3" ligado={!escondendo} />
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSub data-gc="servidor.pasta-do-trilho.context-menu-sub--2">
            <ContextMenuSubTrigger data-gc="servidor.pasta-do-trilho.context-menu-sub-trigger--2">
              {t("servidor.pasta.notificacoesDaComunidade")} <Bell data-gc="servidor.pasta-do-trilho.bell" size={14} />
            </ContextMenuSubTrigger>
            <ContextMenuSubContent data-gc="servidor.pasta-do-trilho.context-menu-sub-content--2">
              {modos.map((m) => (
                <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--6" key={m.chave} onSelect={() => paraTodas({ modo: m.modo })}>
                  {t(`servidor.menu.${m.chave}`)} <Marca data-gc="servidor.pasta-do-trilho.marca--4" ligado={modoEmComum === m.modo} />
                </ContextMenuItem>
              ))}

              <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator--4" />

              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--7" onSelect={() => paraTodas({ everyone: false })}>
                {t("servidor.pasta.silenciarEveryone")}
              </ContextMenuItem>
              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--8" onSelect={() => paraTodas({ everyone: true })}>
                {t("servidor.pasta.permitirEveryone")}
              </ContextMenuItem>

              <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator--5" />

              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--9" onSelect={() => paraTodas({ cargos: false })}>
                {t("servidor.pasta.silenciarCargos")}
              </ContextMenuItem>
              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--10" onSelect={() => paraTodas({ cargos: true })}>
                {t("servidor.pasta.permitirCargos")}
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator--6" />

          <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--11" onSelect={() => setConfigurando(true)}>
            {t("servidor.pasta.configuracoes")} <Settings data-gc="servidor.pasta-do-trilho.settings" size={14} />
          </ContextMenuItem>

          <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--12" onSelect={() => desfazer(pasta.id)}>
            {t("servidor.pasta.desfazer")} <Ungroup data-gc="servidor.pasta-do-trilho.ungroup" size={14} />
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ConfiguracoesDaPasta data-gc="servidor.pasta-do-trilho.configuracoes-da-pasta"
        pasta={pasta}
        sugestao={guilds.map((g) => g.name).join(", ")}
        aberto={configurando}
        onFechar={() => setConfigurando(false)}
        onDesfazer={() => {
          setConfigurando(false);
          desfazer(pasta.id);
        }}
      />
    </>
  );
};

const ConfiguracoesDaPasta: React.FC<{
  pasta: Pasta;
  sugestao: string;
  aberto: boolean;
  onFechar: () => void;
  onDesfazer: () => void;
}> = ({ pasta, sugestao, aberto, onFechar, onDesfazer }) => {
  const { t } = useTranslation();
  const editar = usePastas((s) => s.editar);

  const [nome, setNome] = useState(pasta.nome);
  const [cor, setCor] = useState(pasta.cor ?? "");
  const [icone, setIcone] = useState<IconeDaPasta>(pasta.icone ?? "pasta");
  const [minimizado, setMinimizado] = useState(pasta.mostrarIconeMinimizado ?? false);

  const salvar = () => {
    editar(pasta.id, {
      nome: nome.trim(),
      cor: cor.trim() || null,
      icone,
      mostrarIconeMinimizado: minimizado,
    });
    onFechar();
  };

  return (
    <Dialog data-gc="servidor.pasta-do-trilho.dialog" open={aberto} onOpenChange={(a) => !a && onFechar()}>
      <DialogContent data-gc="servidor.pasta-do-trilho.dialog-content" className="max-w-md">
        <DialogHeader data-gc="servidor.pasta-do-trilho.dialog-header">
          <DialogTitle data-gc="servidor.pasta-do-trilho.dialog-title">{t("servidor.pasta.configuracoes")}</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="servidor.pasta-do-trilho.dialog-body" className="space-y-5">
          <div data-gc="servidor.pasta-do-trilho.div--4">
            <Label data-gc="servidor.pasta-do-trilho.label" htmlFor="nome-da-pasta">{t("servidor.pasta.nome")}</Label>
            <Input data-gc="servidor.pasta-do-trilho.input"
              id="nome-da-pasta"
              value={nome}
              maxLength={40}
              placeholder={sugestao}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div data-gc="servidor.pasta-do-trilho.div--5">
            <Label data-gc="servidor.pasta-do-trilho.label--2" htmlFor="cor-da-pasta">{t("servidor.pasta.cor")}</Label>
            <div data-gc="servidor.pasta-do-trilho.div--6" className="flex items-center gap-2">
              <Input data-gc="servidor.pasta-do-trilho.input--2"
                id="cor-da-pasta"
                value={cor}
                maxLength={32}
                placeholder={t("servidor.pasta.semCor")}
                onChange={(e) => setCor(e.target.value)}
              />
              {/* O seletor do sistema só fala hexadecimal; o campo ao lado aceita o resto. */}
              <input data-gc="servidor.pasta-do-trilho.input--3"
                type="color"
                aria-label={t("servidor.pasta.cor")}
                value={/^#[0-9a-f]{6}$/i.test(cor) ? cor : "#5865f2"}
                onChange={(e) => setCor(e.target.value)}
                className={cn(campoDeCor, "size-10")}
              />
            </div>
            <p data-gc="servidor.pasta-do-trilho.p" className="mt-1.5 text-xs text-ink-faint">{t("servidor.pasta.dicaDaCor")}</p>
          </div>

          <div data-gc="servidor.pasta-do-trilho.div--7" className="flex items-start justify-between gap-4">
            <div data-gc="servidor.pasta-do-trilho.div--8" className="min-w-0">
              <p data-gc="servidor.pasta-do-trilho.p--2" className="text-sm font-medium">{t("servidor.pasta.mostrarIcone")}</p>
              <p data-gc="servidor.pasta-do-trilho.p--3" className="mt-0.5 text-xs text-ink-faint">{t("servidor.pasta.dicaDoIcone")}</p>
            </div>
            <Switch data-gc="servidor.pasta-do-trilho.switch.set-minimizado" checked={minimizado} onCheckedChange={setMinimizado} />
          </div>

          <div data-gc="servidor.pasta-do-trilho.div--9">
            <Label data-gc="servidor.pasta-do-trilho.label--3" htmlFor="icone-da-pasta">{t("servidor.pasta.icone")}</Label>
            <CampoSelect data-gc="servidor.pasta-do-trilho.campo-select"
              id="icone-da-pasta"
              valor={icone}
              onEscolher={(valor) => setIcone(valor as IconeDaPasta)}
              opcoes={ICONES_DE_PASTA.map((nomeDoIcone) => {
                const Desenho = DESENHOS[nomeDoIcone];

                return {
                  valor: nomeDoIcone,
                  rotulo: (
                    <span data-gc="servidor.pasta-do-trilho.span--7" className="flex items-center gap-2">
                      <Desenho data-gc="servidor.pasta-do-trilho.desenho--2" size={15} />
                      {t(`servidor.pasta.icones.${nomeDoIcone}`)}
                    </span>
                  ),
                };
              })}
            />
          </div>
        </DialogBody>

        <DialogFooter data-gc="servidor.pasta-do-trilho.dialog-footer" className="justify-between">
          <Button data-gc="servidor.pasta-do-trilho.button.on-desfazer" variant="danger" onClick={onDesfazer}>
            {t("servidor.pasta.excluir")}
          </Button>

          <span data-gc="servidor.pasta-do-trilho.span--8" className="flex gap-2">
            <Button data-gc="servidor.pasta-do-trilho.button.on-fechar" variant="surface" onClick={onFechar}>
              {t("comum.cancelar")}
            </Button>
            <Button data-gc="servidor.pasta-do-trilho.button.salvar" onClick={salvar}>{t("servidor.pasta.salvar")}</Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
