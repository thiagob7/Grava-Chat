import React, { type ReactNode } from "react";
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
import { SeletorDeEtiqueta } from "~/components/profile/SeletorDeEtiqueta";
import { ServerTag } from "~/components/ServerTag";
import { UserName } from "~/components/UserName";
import { classeDoEnfeite, variaveisDoEnfeite, type EstiloCss } from "~/lib/cosmeticos/estilos";
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
  etiquetaDoServidor?: { guildId: string; tag: string; tagIcon: string | null } | null;
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
    <div className={cn("overflow-hidden rounded-lg bg-surface-0", className)} style={tema}>
      {/*
        A faixa tem altura de banner, não de listra: a 64px qualquer foto virava
        uma tira sem assunto. `bg-cover` + `bg-center` fazem qualquer proporção
        se encaixar — vertical, quadrada ou panorâmica — cortando as sobras em
        vez de espremer a imagem.
      */}
      <div
        className="relative h-24 bg-cover bg-center"
        style={{
          backgroundColor: perfil?.bannerCor ?? avatarColor(id),
          ...(perfil?.bannerUrl ? { backgroundImage: `url(${perfil.bannerUrl})` } : null),
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
          <span aria-hidden className={cn("gc-perfil", efeito)} style={variaveisDoEnfeite({ animar: true, velocidade: "12s" })} />
        )}

        <div className="relative -mt-10 mb-3 flex items-start gap-3">
          <Avatar
            id={id}
            name={displayName}
            url={avatarUrl}
            size={72}
            status={status}
            enfeites={perfil}
            animar
            className="rounded-full ring-[6px] ring-surface-0"
          />

          {/*
            A bolha do status sai do avatar, como um balão de fala. É o convite
            pro campo que quase ninguém acha quando ele fica escondido numa aba
            de configurações.
          */}
          {(statusPersonalizado || onStatus) && (
            /*
              Balão de PENSAMENTO, com as duas bolhinhas saindo do avatar — é o
              que faz o recado parecer da pessoa e não uma etiqueta colada no
              cartão. As bolhinhas são dois `span` absolutos, e não uma cauda em
              CSS: cauda triangular exigiria borda falsa e brigaria com o
              arredondamento na hora que o texto quebrasse em duas linhas.
            */
            <span className="relative mt-7 min-w-0">
              <span
                aria-hidden
                className="absolute -left-3 bottom-1.5 size-2 rounded-full bg-surface-3"
              />
              <span
                aria-hidden
                className="absolute -left-5 bottom-0 size-1.5 rounded-full bg-surface-3"
              />

              {onStatus ? (
                <button
                  onClick={onStatus}
                  className="flex max-w-52 items-center gap-1.5 rounded-2xl bg-surface-3 px-3 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-4 hover:text-ink"
                >
                  {statusPersonalizado ? (
                    <>
                      {statusPersonalizado.emoji && <span>{statusPersonalizado.emoji}</span>}
                      <span className="min-w-0 truncate italic">{statusPersonalizado.texto}</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={14} className="shrink-0" /> Adicionar status
                    </>
                  )}
                </button>
              ) : (
                statusPersonalizado && (
                  <span className="flex max-w-52 items-center gap-1.5 rounded-2xl bg-surface-3 px-3 py-2 text-sm text-ink-muted">
                    {statusPersonalizado.emoji && <span>{statusPersonalizado.emoji}</span>}
                    <span className="min-w-0 truncate italic">{statusPersonalizado.texto}</span>
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
            <p className={cn("min-w-0 truncate text-lg font-bold leading-tight", placa && "gc-placa", placa)}>
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
            A linha de identidade: `@usuario • Etiqueta` e os emblemas.

            A etiqueta é o nome curto que a PESSOA escolheu; os emblemas são do
            SERVIDOR e ela escolheu vestir. Ficam juntos porque é uma frase só —
            "quem eu sou e a que eu pertenço".
          */}
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
            <span>@{username}</span>

            {editavel ? (
              <>
                <span className="text-ink-faint">•</span>
                {/*
                  A etiqueta é um campo aqui mesmo, no lugar onde ela aparece.
                  Editá-la num formulário ao lado obrigaria a ir e voltar com os
                  olhos pra ver se o resultado é o que se queria.
                */}
                <input
                  value={perfil?.etiqueta ?? ""}
                  onChange={(e) => onEtiqueta?.(e.target.value)}
                  maxLength={LIMITS.etiqueta}
                  placeholder="etiqueta"
                  aria-label="Sua etiqueta"
                  className="w-24 rounded border border-line bg-surface-0 px-2 py-0.5 text-sm font-semibold text-ink outline-none ring-brand/60 transition focus:ring-2"
                />
              </>
            ) : (
              perfil?.etiqueta && (
                <>
                  <span className="text-ink-faint">•</span>
                  <span className="font-semibold text-ink">{perfil.etiqueta}</span>
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

            {emblemas.map((emblema) => (
              <span key={emblema.id} title={emblema.nome} className="inline-flex items-center">
                {emblema.emoji ? (
                  <span className="text-base leading-none">{emblema.emoji}</span>
                ) : emblema.iconUrl ? (
                  <img src={emblema.iconUrl} alt={emblema.nome} className="size-4 object-contain" />
                ) : null}
              </span>
            ))}
          </p>

          {(mutualGuilds > 0 || mutualFriends > 0) && (
            <p className="mt-2 text-xs text-ink-faint">
              {[
                mutualFriends > 0 && `${mutualFriends} amigo${mutualFriends > 1 ? "s" : ""} em comum`,
                mutualGuilds > 0 && `${mutualGuilds} servidor${mutualGuilds > 1 ? "es" : ""} em comum`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {bio && (
            <>
              <div className="my-3 h-px bg-line" />
              <p className="whitespace-pre-wrap text-sm text-ink-muted">{bio}</p>
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
                      <img src={cargo.iconUrl} alt="" className="size-3.5 rounded-sm object-cover" />
                    ) : (
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: cargo.color ?? "var(--color-ink-faint)" }}
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
              <p className="text-xs font-semibold uppercase text-ink-faint">Membro desde</p>
              <p className="text-sm text-ink-muted">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(createdAt))}
              </p>
            </>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};
