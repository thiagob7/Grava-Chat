import React, { useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Bell, Bot, Download, Mic, Palette, Pencil, Search, Server, User, X } from "lucide-react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { AccountSection } from "~/components/user-settings/AccountSection";
import { AppearanceSection } from "~/components/user-settings/AppearanceSection";
import { NotificationsSection } from "~/components/user-settings/NotificationsSection";
import { VoiceSection } from "~/components/user-settings/VoiceSection";
import { BotsSection } from "~/components/user-settings/BotsSection";
import { AplicativoSection } from "~/components/user-settings/AplicativoSection";
import { ServidorSection } from "~/components/user-settings/ServidorSection";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { Input } from "~/components/ui/input";
import { ehDesktop } from "~/lib/desktop";
import { cn } from "~/lib/utils";

export type Secao = "conta" | "voz" | "avisos" | "bots" | "aparencia" | "aplicativo" | "servidor";

interface UserSettingsModalProps {
  open: boolean;
  user: SelfUserModel;
  onClose: () => void;
  onLogout: () => void;
  secaoInicial?: Secao;
  onEditarPerfil: () => void;
}

interface Item {
  id: Secao;
  label: string;
  icone: React.ComponentType<{ size?: number | string; className?: string }>;
}

/*
  Os itens em grupos, com o título de cada um.

  Uma lista corrida de sete linhas não diz o que é conta e o que é aparelho —
  e é justamente a divisão que a pessoa procura quando abre isto aqui.
*/
const gruposPara = (admin: boolean): { titulo: string; itens: Item[] }[] => [
  {
    titulo: "Conta do usuário",
    itens: [{ id: "conta", label: "Minha conta", icone: User }],
  },
  {
    titulo: "Configurações do aplicativo",
    itens: [
      { id: "aparencia", label: "Aparência", icone: Palette },
      { id: "voz", label: "Voz e vídeo", icone: Mic },
      { id: "avisos", label: "Notificações", icone: Bell },
      { id: "bots", label: "Bots", icone: Bot },
      /// Some pra quem ja esta no app instalado: oferecer download a quem acabou
      /// de baixar e um convite pra lugar nenhum.
      ...(ehDesktop() ? [] : [{ id: "aplicativo" as const, label: "Baixar o app", icone: Download }]),
    ],
  },
  /// Esconder o item é conforto, não segurança: quem decide é a API, que
  /// devolve 404 na rota pra qualquer conta fora da lista.
  ...(admin
    ? [{ titulo: "Administração", itens: [{ id: "servidor" as const, label: "Servidor", icone: Server }] }]
    : []),
];

const TITULOS: Record<Secao, string> = {
  conta: "Minha conta",
  voz: "Voz e vídeo",
  avisos: "Notificações",
  bots: "Bots",
  aparencia: "Aparência",
  aplicativo: "Baixar o app",
  servidor: "Servidor",
};

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  open,
  user,
  onClose,
  onLogout,
  secaoInicial = "conta",
  onEditarPerfil,
}) => {
  const [secao, setSecao] = useState<Secao>(secaoInicial);
  const [busca, setBusca] = useState("");

  /// A busca corta itens, não grupos: grupo que ficou sem item some junto.
  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const todos = gruposPara(user.admin);
    if (!termo) return todos;

    return todos
      .map((grupo) => ({
        ...grupo,
        itens: grupo.itens.filter((item) => item.label.toLowerCase().includes(termo)),
      }))
      .filter((grupo) => grupo.itens.length > 0);
  }, [busca, user.admin]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
        {/*
          Janela grande e centrada, não uma caixinha no meio da tela: quase
          toda seção daqui é lista longa — dispositivos de áudio, avisos por
          servidor, temas — e a caixa de antes (896px de largura, 80% de
          altura) obrigava a rolar pra ver três linhas de cada vez.
        */}
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 flex h-[min(900px,92vh)] w-[min(1240px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-surface-1 shadow-2xl outline-none"
          aria-label="Configurações do usuário"
        >
          <DialogPrimitive.Title className="sr-only">Configurações do usuário</DialogPrimitive.Title>

          {/*
            Barra lateral MAIS CLARA que o conteúdo, e não mais escura.

            É a inversão que a referência faz e que dá o desenho: a navegação
            sobe pra cor de menu (`surface-4`) e o conteúdo desce pra cor de
            barra lateral (`surface-1`). Antes as duas colunas eram `surface-1`
            e `surface-2` — dois quase-pretos separados por 4 pontos de brilho,
            e a janela lia como um bloco só.

            A largura acompanha a janela em vez de ser fixa: numa tela estreita
            a lateral não pode comer o conteúdo, e numa larga não pode virar
            uma tira de rótulos truncados.
          */}
          <nav className="flex w-[max(15.75rem,min(24svw,20rem))] shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface-4 px-3 pb-0 pt-4">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar configurações"
                aria-label="Pesquisar configurações"
                className="h-9 border-transparent pl-8 text-sm shadow-none focus-visible:border-white/15 focus-visible:ring-0"
              />
            </div>

            <button
              onClick={onEditarPerfil}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-hover"
            >
              <Avatar
                id={user.id}
                name={user.displayName}
                url={user.avatarUrl}
                size={36}
                enfeites={user.perfil}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{user.displayName}</span>
                <span className="flex items-center gap-1 text-xs text-ink-muted">
                  Editar perfil <Pencil size={11} />
                </span>
              </span>
            </button>

            <div className="flex flex-col gap-2">
              {grupos.map((grupo) => (
                <div key={grupo.titulo} className="flex flex-col gap-[3px]">
                  <p className="truncate px-2.5 pb-[3px] pt-1 text-[11px] font-semibold uppercase leading-4 tracking-[0.02em] text-ink-faint">
                    {grupo.titulo}
                  </p>

                  {grupo.itens.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSecao(item.id)}
                      aria-current={secao === item.id}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-[5px] text-left text-sm transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                        secao === item.id
                          ? "bg-surface-3 font-medium text-ink"
                          : "text-ink-muted hover:bg-hover hover:text-ink",
                      )}
                    >
                      {/*
                        O ícone é o que deixa a lista percorrível de relance —
                        sete rótulos alinhados só se leem palavra por palavra.
                        Ele acende junto com o item, senão vira ruído cinza.
                      */}
                      <item.icone
                        size={20}
                        className={cn(
                          "shrink-0 transition",
                          secao === item.id ? "text-ink" : "text-ink-faint",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {!grupos.length && (
              <p className="px-2 text-xs text-ink-faint">Nada com esse nome por aqui.</p>
            )}
          </nav>

          {/*
            O título da seção mora numa barra fixa, com o X ao lado: antes cada
            seção repetia o próprio nome lá dentro e o X flutuava por cima do
            conteúdo, encostando no que estivesse no canto.
          */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-15 shrink-0 items-center justify-between gap-4 border-b border-line px-4">
              <h2 className="truncate text-lg font-semibold">{TITULOS[secao]}</h2>

              <DialogPrimitive.Close
                aria-label="Fechar"
                className="flex size-[34px] shrink-0 items-center justify-center rounded-lg text-ink-faint transition hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                <X size={20} />
              </DialogPrimitive.Close>
            </div>

            {/*
              A coluna de leitura tem teto e é centrada.

              Sem isto o conteúdo se esparramava por toda a largura da janela:
              numa janela de 1240px sobravam quase 400px de vazio à direita, e
              cada linha de texto atravessava a tela inteira — largura em que
              o olho perde a volta da linha. O teto cresce com a janela, mas
              para: `max(40rem, min(90%, 50rem))`.
            */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[max(40rem,min(90%,50rem))] px-[clamp(1rem,3vw,1.5rem)] pb-8 pt-5">
                {/*
                  Caixa por seção, e a chave é o `secao`: uma tela de configuração
                  que quebra mostra um cartão no lugar dela, e trocar de seção já
                  limpa o estrago. Sem isso, o painel de servidor tropeçando num
                  formato inesperado da API levava a aplicação inteira junto.
                */}
                <ErrorBoundary key={secao} onde={`configurações · ${secao}`} compacto>
                  {secao === "conta" && <AccountSection user={user} onLogout={onLogout} />}
                  {secao === "voz" && <VoiceSection />}
                  {secao === "avisos" && <NotificationsSection />}
                  {secao === "bots" && <BotsSection />}

                  {secao === "aparencia" && <AppearanceSection />}
                  {secao === "aplicativo" && <AplicativoSection />}
                  {secao === "servidor" && user.admin && <ServidorSection />}
                </ErrorBoundary>
              </div>
            </div>
          </div>

        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
