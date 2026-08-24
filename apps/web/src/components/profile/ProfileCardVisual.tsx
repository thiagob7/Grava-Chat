import React, { useState, type ReactNode } from "react";
import { PlusCircle } from "lucide-react";
import { LIMITS } from "@gravae/shared";
import type {
  Emblema,
  EstiloDePerfil,
  PresenceStatus,
  Role,
  StatusPersonalizado,
} from "@gravae/shared";

import { Avatar } from "~/components/Avatar";
import { PatenteAnimada } from "~/components/PatenteAnimada";
import { SeletorDeEtiqueta } from "~/components/profile/SeletorDeEtiqueta";
import { ServerTag } from "~/components/ServerTag";
import { UserName } from "~/components/UserName";
import {
  classeDoEnfeite,
  variaveisDoEnfeite,
  type EstiloCss,
} from "~/lib/cosmeticos/estilos";
import { avatarColor } from "~/lib/format";
import { cn } from "~/lib/utils";

interface ProfileCardVisualProps {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  status?: PresenceStatus;
  perfil?: EstiloDePerfil | null;
  /**
   * A etiqueta de servidor já RESOLVIDA (`tag` e `tagIcon`, não só o id).
   *
   * Chega separada do `perfil` porque quem lê não teria como resolver sozinho:
   * é a etiqueta de um servidor que o observador pode nem conhecer. Quem resolve
   * é a API, que já sabe.
   */
  etiquetaDoServidor?: {
    guildId: string;
    tag: string;
    tagIcon: string | null;
  } | null;
  statusPersonalizado?: StatusPersonalizado | null;
  corDoCargo?: string | null;
  bio?: string | null;
  createdAt?: string | null;
  mutualFriends?: number;
  mutualGuilds?: number;
  /** os cargos desta pessoa NESTE servidor; vazio numa DM */
  cargos?: Role[];
  /** os emblemas que ela veste aqui, já resolvidos das definições do servidor */
  emblemas?: Emblema[];
  /** os botões redondos sobre a faixa do topo */
  acoesDoTopo?: ReactNode;
  /** o que vai no rodapé: mandar mensagem, aceitar pedido… */
  children?: ReactNode;
  className?: string;
  /**
   * Modo de edição: no SEU cartão, dentro do editor.
   *
   * A etiqueta e o status são editados aqui dentro, e não num formulário ao
   * lado, porque os dois são pedaços do cartão — mudar num campo distante e
   * conferir no cartão é ir e voltar com os olhos a cada letra.
   */
  editavel?: boolean;
  onEtiqueta?: (valor: string) => void;
  onEtiquetaDoServidor?: (guildId: string | null) => void;
  /**
   * Passar isto torna o balão de status clicável — INDEPENDENTE de `editavel`.
   *
   * São coisas diferentes: `editavel` é "estou no editor, mexendo na minha
   * aparência"; o status é um recado de momento, e ele se muda do cartão mesmo,
   * sem abrir editor nenhum. Amarrar os dois obrigaria a entrar no editor pra
   * escrever "volto em 10 minutos".
   */
  onStatus?: () => void;
}

/**
 * O cartão de perfil, só o visual.
 *
 * Existe pra a prévia do editor renderizar **o componente de verdade**. Uma
 * prévia que é cópia do layout mente na primeira vez que o layout muda — e
 * mente exatamente para quem está escolhendo como vai aparecer, que é a pessoa
 * que menos pode ser enganada aqui.
 *
 * Por isso nada de dado vem de dentro: sem `useQuery`, sem store. O popover
 * passa o que buscou; o editor passa o rascunho. Os dois desenham igual porque
 * é o mesmo código.
 */
export const ProfileCardVisual: React.FC<ProfileCardVisualProps> = ({
  id,
  displayName,
  username,
  avatarUrl,
  status,
  perfil,
  etiquetaDoServidor,
  statusPersonalizado,
  corDoCargo,
  bio,
  createdAt,
  mutualFriends = 0,
  mutualGuilds = 0,
  cargos = [],
  emblemas = [],
  acoesDoTopo,
  children,
  className,
  editavel = false,
  onEtiqueta,
  onEtiquetaDoServidor,
  onStatus,
}) => {
  /** a etiqueta só vira campo depois do clique; ver o comentário lá embaixo */
  const [editandoEtiqueta, setEditandoEtiqueta] = useState(false);

  /** `nenhuma` está no enum só pra a grade ter o que marcar como vazio */
  const temDecoracao = Boolean(perfil?.decoracao && perfil.decoracao !== "nenhuma");
  const efeito = classeDoEnfeite("perfil", perfil?.efeito);
  const placa = classeDoEnfeite("placa", perfil?.placa);

  /**
   * O tema pinta o corpo do cartão. Sem escolha, fica o `surface-0` de sempre —
   * e é isso que mantém o cartão de quem nunca personalizou idêntico ao antigo.
   */
  const tema: EstiloCss | undefined = perfil?.temaPrimario
    ? {
        background: perfil.temaSecundario
          ? `linear-gradient(160deg, ${perfil.temaPrimario}, ${perfil.temaSecundario})`
          : perfil.temaPrimario,
        /**
         * O recorte da bolinha de status tem que acompanhar o tema, senão fica
         * um aro cinza no meio de um cartão colorido.
         */
        "--gc-recorte": perfil.temaSecundario ?? perfil.temaPrimario,
      }
    : undefined;

  return (
    <div
      className={cn("overflow-hidden rounded-lg bg-surface-0", className)}
      style={tema}
    >
      {/*
        A faixa é uma PROPORÇÃO (5:2), não uma altura fixa.

        Com `h-24`, o mesmo GIF era cortado de um jeito no cartão estreito do
        popover e de outro na prévia larga do editor — a pessoa escolhia um
        enquadramento e via outro. Com proporção, o corte é o mesmo em qualquer
        largura, e é a mesma proporção que o Discord usa (300×120), que é o que
        as pessoas já têm salvo.

        `bg-cover` + `bg-center` encaixam qualquer imagem — vertical, quadrada ou
        panorâmica — cortando as sobras em vez de espremer.
      */}
      <div
        className="relative aspect-[5/2] bg-cover bg-center"
        style={{
          backgroundColor: perfil?.bannerCor ?? avatarColor(id),
          ...(perfil?.bannerUrl
            ? { backgroundImage: `url(${perfil.bannerUrl})` }
            : null),
        }}
      >
        {acoesDoTopo}
      </div>

      {/*
        O efeito de perfil cobre o cartão inteiro e fica ATRÁS do conteúdo, com
        `pointer-events: none`: é enfeite, não pode roubar um clique do botão de
        mandar mensagem.
      */}
      <div className="relative px-4 pb-4 [--gc-recorte:var(--color-surface-0)]">
        {efeito && (
          <span
            aria-hidden
            className={cn("gc-perfil", efeito)}
            style={variaveisDoEnfeite({ animar: true, velocidade: "12s" })}
          />
        )}

        <div className="relative -mt-10 mb-3 flex items-start gap-3">
          {/*
            O anel de 6px existe pra descolar o avatar do banner que ele invade
            — sem ele a foto encosta na imagem de trás e some. Mas QUEM TEM
            DECORAÇÃO já ganhou essa separação da própria arte, e aí o anel vira
            uma borda preta cortando entre a foto e o enfeite. O Discord não tem
            isso: lá a decoração encosta na foto.
          */}
          <Avatar
            id={id}
            name={displayName}
            url={avatarUrl}
            size={72}
            status={status}
            enfeites={perfil}
            animar
            className={cn(
              "rounded-full",
              !temDecoracao && "ring-[6px] ring-surface-0",
            )}
          />

          {/*
            A bolha do status sai do avatar, como um balão de fala. É o convite
            pro campo que quase ninguém acha quando ele fica escondido numa aba
            de configurações.
          */}
          {(statusPersonalizado || onStatus) && (
            /*
              Balão de PENSAMENTO: ele sobe pro alto do avatar e as bolhinhas
              DESCEM na diagonal até ele, cada uma menor que a anterior. É o que
              faz o recado parecer sair da pessoa.

              Antes o balão ficava na altura do meio do avatar e as bolhinhas
              saíam na horizontal — sem a diagonal, elas não apontam pra
              ninguém, e o balão parecia uma etiqueta colada ao lado.

              São `span` absolutos e não uma cauda em CSS porque cauda
              triangular exigiria borda falsa e brigaria com o arredondamento na
              hora que o texto quebrasse em duas linhas.
            */
            <span className="relative mt-1 min-w-0">
              <span
                aria-hidden
                className="absolute -bottom-1 -left-2 size-2.5 rounded-full bg-surface-3 shadow-md shadow-black/40"
              />
              <span
                aria-hidden
                className="absolute -bottom-3 -left-4 size-1.5 rounded-full bg-surface-3 shadow-md shadow-black/40"
              />

              {onStatus ? (
                <button
                  onClick={onStatus}
                  className="flex max-w-52 items-center gap-1.5 rounded-2xl bg-surface-3 px-3 py-2 text-left text-sm text-ink-muted shadow-lg shadow-black/30 transition hover:bg-surface-4 hover:text-ink"
                >
                  {statusPersonalizado ? (
                    <>
                      {statusPersonalizado.emoji && (
                        <span>{statusPersonalizado.emoji}</span>
                      )}
                      <span className="min-w-0 truncate italic">
                        {statusPersonalizado.texto}
                      </span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={14} className="shrink-0" />
                      <span className="whitespace-nowrap">
                        Adicionar status
                      </span>
                    </>
                  )}
                </button>
              ) : (
                statusPersonalizado && (
                  <span className="flex max-w-52 items-center gap-1.5 rounded-2xl bg-surface-3 px-3 py-2 text-sm text-ink-muted shadow-lg shadow-black/30">
                    {statusPersonalizado.emoji && (
                      <span>{statusPersonalizado.emoji}</span>
                    )}
                    <span className="min-w-0 truncate italic">
                      {statusPersonalizado.texto}
                    </span>
                  </span>
                )
              )}
            </span>
          )}
        </div>

        <div className="relative">
          <div className="flex items-center gap-2">
            {/*
              `md` e `animar` só aqui: é UM cartão na tela, aberto de propósito
              por quem clicou. É o lugar onde o enfeite pode custar caro — na
              lista de cem membros, não.
            */}
            <p
              className={cn(
                "min-w-0 truncate text-lg font-bold leading-tight",
                placa && "gc-placa",
                placa,
              )}
            >
              <UserName
                nome={displayName}
                perfil={perfil}
                corDoCargo={corDoCargo}
                tamanho="md"
                animar
              />
            </p>
          </div>

          {/*
            A linha de identidade: `@usuario • Etiqueta`, a patente e os emblemas.

            A etiqueta é o nome curto que a PESSOA escolheu; os emblemas são do
            SERVIDOR e ela escolheu vestir. Ficam juntos porque é uma frase só —
            "quem eu sou e a que eu pertenço".

            A patente entra ANTES dos emblemas, e não depois, porque ela é a
            metade "eu" da frase: vem do perfil da pessoa e a acompanha até numa
            DM, onde não existe emblema nenhum pra vir depois dela.
          */}
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
            <span>@{username}</span>

            {editavel ? (
              <>
                <span className="text-ink-faint">•</span>
                {/*
                  A etiqueta é TEXTO até você clicar nela.

                  Como campo permanente, uma caixa de formulário no meio de uma
                  linha de texto pesa demais: ela empurrava a etiqueta do
                  servidor pra linha de baixo e fazia o cartão inteiro parecer
                  maior do que é. Clicar abre o campo, sair fecha — e o que se vê
                  no descanso é exatamente o que os outros vão ver.
                */}
                {editandoEtiqueta ? (
                  <input
                    autoFocus
                    value={perfil?.etiqueta ?? ""}
                    onChange={(e) => onEtiqueta?.(e.target.value)}
                    onBlur={() => setEditandoEtiqueta(false)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setEditandoEtiqueta(false)
                    }
                    maxLength={LIMITS.etiqueta}
                    placeholder="etiqueta"
                    aria-label="Sua etiqueta"
                    size={LIMITS.etiqueta}
                    className="w-16 rounded bg-surface-3 px-1.5 py-0 text-sm font-semibold text-ink outline-none ring-ink-faint/70 transition focus:ring-2"
                  />
                ) : (
                  <button
                    onClick={() => setEditandoEtiqueta(true)}
                    title="Clique para editar sua etiqueta"
                    className="rounded px-1 font-semibold text-ink transition hover:bg-surface-3"
                  >
                    {perfil?.etiqueta || (
                      <span className="text-ink-faint">etiqueta</span>
                    )}
                  </button>
                )}
              </>
            ) : (
              perfil?.etiqueta && (
                <>
                  <span className="text-ink-faint">•</span>
                  <span className="font-semibold text-ink">
                    {perfil.etiqueta}
                  </span>
                </>
              )
            )}

            {/*
              A etiqueta de servidor: quem olha só vê a escolhida; quem edita
              escolhe aqui mesmo, do lado dela. É o mesmo princípio da etiqueta
              pessoal — mudar longe de onde o resultado aparece obriga a ir e
              voltar com os olhos.
            */}
            {editavel ? (
              <SeletorDeEtiqueta
                atual={perfil?.tagGuildId}
                onEscolher={(guildId) => onEtiquetaDoServidor?.(guildId)}
              />
            ) : (
              <ServerTag etiqueta={etiquetaDoServidor} />
            )}

            {perfil?.patente && (
              /*
                `animar` porque o cartão abre um de cada vez — é exatamente a
                condição que o resto do catálogo usa pra soltar a animação. A
                insígnia se monta uma vez, quando o cartão aparece, e para.
              */
              <PatenteAnimada patente={perfil.patente} animar />
            )}

            {emblemas.map((emblema) => (
              <span
                key={emblema.id}
                title={emblema.nome}
                className="inline-flex items-center"
              >
                {emblema.emoji ? (
                  <span className="text-base leading-none">
                    {emblema.emoji}
                  </span>
                ) : emblema.iconUrl ? (
                  <img
                    src={emblema.iconUrl}
                    alt={emblema.nome}
                    className="size-4 object-contain"
                  />
                ) : null}
              </span>
            ))}
          </p>

          {(mutualGuilds > 0 || mutualFriends > 0) && (
            <p className="mt-2 text-xs text-ink-faint">
              {[
                mutualFriends > 0 &&
                  `${mutualFriends} amigo${mutualFriends > 1 ? "s" : ""} em comum`,
                mutualGuilds > 0 &&
                  `${mutualGuilds} servidor${mutualGuilds > 1 ? "es" : ""} em comum`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {bio && (
            <>
              <div className="my-3 h-px bg-line" />
              <p className="whitespace-pre-wrap text-sm text-ink-muted">
                {bio}
              </p>
            </>
          )}

          {cargos.length > 0 && (
            <>
              <div className="my-3 h-px bg-line" />
              <p className="mb-1.5 text-xs font-semibold uppercase text-ink-faint">
                {cargos.length === 1 ? "Cargo" : `Cargos — ${cargos.length}`}
              </p>

              {/*
                O cargo é a informação mais útil do cartão depois do nome: é o
                que diz se a pessoa manda no servidor. Estava só na coluna da
                direita, onde só aparece a cor de UM cargo — o mais alto que tem
                cor — e nenhum dos outros.
              */}
              <div className="flex flex-wrap gap-1.5">
                {cargos.map((cargo) => (
                  <span
                    key={cargo.id}
                    className="flex items-center gap-1.5 rounded bg-surface-3 px-2 py-0.5 text-xs font-medium"
                  >
                    {cargo.iconEmoji ? (
                      <span>{cargo.iconEmoji}</span>
                    ) : cargo.iconUrl ? (
                      <img
                        src={cargo.iconUrl}
                        alt=""
                        className="size-3.5 rounded-sm object-cover"
                      />
                    ) : (
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            cargo.color ?? "var(--color-ink-faint)",
                        }}
                      />
                    )}
                    {cargo.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {createdAt && (
            <>
              <div className="my-3 h-px bg-line" />
              <p className="text-xs font-semibold uppercase text-ink-faint">
                Membro desde
              </p>
              <p className="text-sm text-ink-muted">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
                  new Date(createdAt),
                )}
              </p>
            </>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};
