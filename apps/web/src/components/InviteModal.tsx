import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import { toast } from "react-toastify";

import { useCreateInvite } from "~/@core/application/queries/guild/use-create-invite";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { openDm } from "~/@core/application/requests/friend/open-dm";
import { sendMessage } from "~/@core/lib/websocket/send-message";
import { Avatar } from "~/components/Avatar";
import { CarrosselDeEtapas } from "~/components/ui/carrossel-de-etapas";
import {
  ConfiguracoesDoConvite,
  type OpcoesDoConvite,
} from "~/components/ConfiguracoesDoConvite";
import { copiarTexto } from "~/lib/copiar";
import { formatTimestamp } from "~/lib/format";
import { useAparencia } from "~/stores/aparencia";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { CampoComAcao, Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface InviteModalProps {
  open: boolean;
  guildId: string | undefined;
  guildName?: string;
  onClose: () => void;
}

type Envio = "enviando" | "enviado" | "erro";

/*
  A ORDEM importa: é dela que sai o lado de onde cada etapa entra. Ir de
  "convidar" para "opcoes" é avançar, e o painel vem da direita; voltar traz o
  de trás, da esquerda. Sem uma ordem declarada, as duas trocas pareceriam a
  mesma e o movimento deixaria de dizer para onde se está indo.
*/
type Etapa = "convidar" | "opcoes";
const ETAPAS: readonly Etapa[] = ["convidar", "opcoes"];

const MASCARA = "••••••••••••••••••••••••••";

export const InviteModal: React.FC<InviteModalProps> = ({ open, guildId, guildName, onClose }) => {
  const createInvite = useCreateInvite();
  const [link, setLink] = useState<string | null>(null);
  /// Vem do servidor, e não de um "7 dias" escrito na tela: hoje o modal cria o
  /// convite sem `expiresInHours`, então ele nasce sem validade — e dizer um
  /// prazo que não existe é pior que não dizer prazo nenhum.
  const [expiraEm, setExpiraEm] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  /*
    Qual conteúdo a caixa está mostrando. Uma caixa só: as opções TROCAM de
    lugar com a lista de amigos em vez de abrir um segundo diálogo por cima —
    empilhar dois esconde o primeiro atrás do véu e faz parecer que se saiu de
    onde estava, quando é o mesmo assunto continuando.
  */
  const [vista, setVista] = useState<Etapa>("convidar");
  /// O que o link ATUAL tem, pra tela de opções abrir mostrando a verdade em vez
  /// do último rascunho de quem mexeu nela e desistiu.
  const [opcoes, setOpcoes] = useState<OpcoesDoConvite>({
    expiresInHours: null,
    maxUses: null,
  });
  const [revelado, setRevelado] = useState(false);
  const prefs = useAparencia();

  /// O link é o que dá acesso ao servidor. Numa live, ele vale um convite
  /// aberto para qualquer um que leia a tela.
  const escondido = !revelado && prefs.modoStreamer && prefs.streamerEscondeConvites;
  const [busca, setBusca] = useState("");
  const [envios, setEnvios] = useState<Record<string, Envio>>({});

  const { data: amizades, isLoading } = useFindFriends(open);

  const { mutateAsync } = createInvite;

  /*
    Gera um link e passa a mostrá-lo. Serve às duas entradas: a abertura do
    modal, com as opções padrão, e o "Criar novo link" da tela de opções.

    Guardo as opções junto com o link porque é o único jeito de a tela de opções
    abrir com o que está valendo — o servidor devolve `expiresAt`, uma data, e
    dela não dá pra recuperar "7 dias".
  */
  const gerar = useCallback(
    (escolhidas: OpcoesDoConvite) => {
      if (!guildId) return;

      setLink(null);
      setExpiraEm(null);
      setCopied(false);

      void mutateAsync({ guildId, ...escolhidas })
        .then((invite) => {
          setLink(`${window.location.origin}/invite/${invite.code}`);
          setExpiraEm(invite.expiresAt);
          setOpcoes(escolhidas);
          setVista("convidar");
        })
        .catch(() => undefined);
    },
    [guildId, mutateAsync],
  );

  useEffect(() => {
    if (!open || !guildId) return;

    setBusca("");
    setEnvios({});
    setVista("convidar");
    gerar({ expiresInHours: null, maxUses: null });
  }, [open, guildId, gerar]);

  const amigos = useMemo(() => {
    const aceitos = (amizades ?? []).filter((a) => a.status === "ACCEPTED");
    const termo = busca.trim().toLowerCase();
    if (!termo) return aceitos;

    return aceitos.filter(
      (a) =>
        a.user.displayName.toLowerCase().includes(termo) ||
        a.user.username.toLowerCase().includes(termo),
    );
  }, [amizades, busca]);

  const copy = async () => {
    if (!link) return;

    /// Só diz "copiado" se copiou. O aviso saía antes de qualquer confirmação, e
    /// no Windows ele aparecia com a área de transferência vazia.
    if (!(await copiarTexto(link))) {
      toast.error("Não deu pra copiar. Selecione o link e copie na mão.");
      return;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const convidar = async (userId: string) => {
    if (!link) return;

    setEnvios((atual) => ({ ...atual, [userId]: "enviando" }));

    try {
      const canal = await openDm(userId);
      await sendMessage({ channelId: canal.id, content: link, nonce: crypto.randomUUID() });

      setEnvios((atual) => ({ ...atual, [userId]: "enviado" }));
    } catch {
      setEnvios((atual) => ({ ...atual, [userId]: "erro" }));
      toast.error("Não deu pra mandar o convite. Tente de novo.");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        {/*
          `overflow-hidden` recorta o deslize das etapas: sem ele, o painel que
          entra apareceria por fora dos cantos arredondados antes de assentar.

          A altura NÃO é fixa. Quem a anima é o carrossel, que mede o conteúdo
          de cada etapa e leva a caixa até lá — é assim na referência, e foi o
          que eu tinha matado ao travar em `h-[33rem]`.
        */}
        {/*
          Sem altura fixa: cada etapa tem a sua, e a caixa vai de uma à outra.

          Convidar é uma lista — precisa de espaço, e é alta. Opções são dois
          campos e um aviso, e é baixa. Amarrar as duas na mesma altura deixava
          a de opções com um vazio embaixo. Quem anima a passagem é o carrossel.

          `overflow-hidden` recorta o deslize das etapas: sem ele, o painel que
          entra apareceria por fora dos cantos arredondados antes de assentar.
        */}
        <DialogContent className="overflow-hidden">
          <CarrosselDeEtapas
            etapa={vista}
            etapas={ETAPAS}
            paineis={{
              opcoes: (
                <ConfiguracoesDoConvite
                  atuais={opcoes}
                  gerando={createInvite.isPending}
                  onVoltar={() => setVista("convidar")}
                  onCriar={gerar}
                />
              ),
              convidar: (
                <>
              <DialogHeader>
              <DialogTitle>Convidar amigos {guildName ? `para ${guildName}` : ""}</DialogTitle>
              <DialogDescription>
                Quem você escolher recebe o link numa conversa privada.
              </DialogDescription>
            </DialogHeader>

            {/*
              A cascata NÃO fica aqui.

              Ela é do conteúdo que a etapa traz — a lista de gente —, e não da
              moldura em volta dele. O campo de busca e o rodapé do link são
              moldura: eles existem igual nas duas pontas da troca, e animá-los
              faria a tela inteira piscar em vez de o conteúdo assentar.
            */}
            <DialogBody className="space-y-3">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar amigos"
                  className="pl-9"
                />
              </div>

              {/*
                400px é o que dá à etapa de convidar a altura da referência —
                lista de gente pede espaço, e com pouca gente o vazio embaixo é
                convite pra rolar e procurar, não erro de medida.
              */}
              <div className="cascata h-[25rem] space-y-0.5 overflow-y-auto pr-1">
                {isLoading && <Vazio>Carregando…</Vazio>}

                {!isLoading && !amigos.length && (
                  <Vazio>
                    {busca.trim()
                      ? "Nenhum amigo com esse nome."
                      : "Você ainda não tem amigos adicionados. Use o link ali embaixo."}
                  </Vazio>
                )}

                {amigos.map(({ user }) => {
                  const estado = envios[user.id];

                  return (
                    <div
                      key={user.id}
                      /*
                        Realce de passagem: branco a 5%, raio médio, 44px de
                        altura mínima. É a régua da referência
                        (`--background-modifier-hover`, que o nosso `--color-hover`
                        já reproduz) — o `surface-3` de antes era um degrau claro
                        demais e a linha saltava do fundo em vez de acender.
                      */
                      className="flex min-h-11 items-center gap-2.5 rounded-md px-2 py-1.5 transition hover:bg-hover"
                    >
                      {/*
                    A presença vem junto: a bolinha diz se adianta mandar o
                    convite agora ou se a pessoa vai ler amanhã. É o mesmo
                    `status` que a lista de membros e a de conversas já mostram.
                  */}
                  <Avatar
                    id={user.id}
                    name={user.displayName}
                    url={user.avatarUrl}
                    size={32}
                    status={user.status}
                  />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{user.displayName}</p>
                        <p className="truncate text-xs text-ink-faint">{user.username}</p>
                      </div>

                      <Button
                        size="sm"
                        /*
                          `outline`, e não `surface`: o diálogo JÁ é `surface-3`, e
                          o botão `surface` ficava exatamente da cor do fundo — o
                          "Convidar" virava texto solto, sem parecer clicável.
                        */
                        variant={estado === "enviado" ? "ghost" : "outline"}
                        disabled={!link || estado === "enviando" || estado === "enviado"}
                        onClick={() => void convidar(user.id)}
                        className={cn(estado === "enviado" && "text-online")}
                      >
                        {estado === "enviado" ? (
                          <>
                            <Check size={14} /> Enviado
                          </>
                        ) : estado === "enviando" ? (
                          "Enviando…"
                        ) : estado === "erro" ? (
                          "Tentar de novo"
                        ) : (
                          "Convidar"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-divisor pt-3">
                {/*
                  Frase inteira, do tamanho do texto normal — não uma etiqueta em
                  caixa alta. É como a referência escreve, e o motivo é que isto não
                  é o rótulo de um campo de formulário: é a segunda saída da tela,
                  pra quem não achou a pessoa na lista de cima.
                */}
                <p className="mb-2 text-sm font-medium text-ink">
                  Ou envie um link de convite para um amigo:
                </p>
                <CampoComAcao
                  readOnly
                  value={link ? (escondido ? MASCARA : link) : "Gerando…"}
                  onFocus={() => setRevelado(true)}
                  title={escondido ? "Escondido pelo modo streamer — clique para ver" : undefined}
                  acao={
                    <Button size="sm" onClick={() => void copy()} disabled={!link}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copiado" : "Copiar"}
                    </Button>
                  }
                />

                <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-faint">
                  <span>
                    {expiraEm
                      ? `Seu link de convite expira em ${formatTimestamp(expiraEm)}.`
                      : "Seu link de convite não expira."}
                    {opcoes.maxUses ? ` Vale ${opcoes.maxUses} uso(s).` : ""}
                  </span>

                  <button
                    type="button"
                    onClick={() => setVista("opcoes")}
                    className="text-brand transition hover:underline"
                  >
                    Editar link de convite
                  </button>
                </p>
              </div>
                </DialogBody>
                </>
              ),
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

const Vazio: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-2 py-8 text-center text-sm text-ink-muted">{children}</p>
);
