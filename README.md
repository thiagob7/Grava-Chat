# Gravaê Chat

Um Discord self-hosted: servidores, canais de texto e voz, webcam, compartilhamento
de tela e live por RTMP. Roda no navegador e como app desktop (Electron).

## Rodar

```bash
yarn install
cp .env.example .env      # preencha GOOGLE_CLIENT_ID / SECRET na Fase 1
yarn infra:up             # mongo (replica set) + redis + livekit (SFU) + minio (fallback)
yarn db:push              # cria as collections e os indices
yarn dev                  # api :3333  +  web :5173
yarn desktop              # o app de desktop, em cima do mesmo :5173
```

- Web: http://localhost:5173
- API: http://localhost:3333/api/health
- Storage: **Cloudflare R2** (credenciais vindas do projeto `Seu-Negocio`)
- LiveKit (SFU): ws://localhost:7880 — mídia em UDP 7882, fallback TCP 7881

**Redis fica na 6381**, não na 6379. Se já houver um Redis instalado na máquina,
ele fica com a 6379 e o container perde a porta sem erro nenhum — a aplicação
conecta no Redis errado e tudo "funciona" até você tentar inspecionar o estado e
não achar nada. Aconteceu aqui.

`yarn infra:reset` derruba os containers **e apaga os volumes** (banco zerado).

## Estrutura

Segue os padrões do Gravaê: `@core` + React Query no front (como o **backoffice**)
e repository + service + validations no backend (como o **gravae-hub**).

```
apps/api/src/
├── routes/         controllers finos: validam, chamam o service, publicam o evento
├── services/       regra de negócio; não conhecem Fastify nem Socket.IO
├── repositories/   único ponto de acesso ao banco; só queries Prisma
├── validations/    schemas Zod de entrada (compostos com @gravae/shared)
├── realtime/       gateway Socket.IO + handlers (chamam os mesmos services)
└── lib/            http (erros de domínio), prisma, redis, mongo, serialize

apps/web/src/
├── @core/
│   ├── application/queries/    hooks React Query (use-kebab-case.ts)
│   ├── application/requests/   funções de request com axios (kebab-case.ts)
│   ├── domain/{models,dtos}/   *-model.ts e *-dto.ts
│   ├── infra/constants/        query-keys.ts
│   └── lib/                    api.ts (axios) e websocket/{on,off,emit}-*.ts
├── components/     componentes do app + ui/ (shadcn com o NOSSO tema)
├── pages/presentation/  telas por feature
├── contexts/       session-context
├── hooks/          use-realtime (socket → cache do React Query)
└── stores/         só estado efêmero de cliente: voz (LiveKit) e "digitando"

apps/desktop/src/
├── main/           processo principal: janela, push-to-talk global, captura
│                   de tela e o deep link `gravae://` do login
└── preload/        a ponte `window.gravae` (contextBridge, nada de Node vaza)

packages/shared     tipos, schemas Zod, contrato dos eventos de WebSocket e o
                    contrato da ponte do desktop (os dois lados compilam contra
                    o mesmo tipo)
```

Imports usam o alias `~` nos dois apps. `packages/shared` é consumido como
**TypeScript cru** (sem build): qualquer evento de tempo real precisa ser
declarado em `packages/shared/src/events.ts`, então uma divergência entre front e
back vira erro de compilação em vez de bug silencioso.

## Testes

```bash
python3 apps/api/scripts/smoke.py          # REST: auth, servidor, convite, canais, permissões
node apps/api/scripts/smoke-socket.mjs     # tempo real: mensagens, reações, presença, persistência
node apps/api/scripts/smoke-refresh.mjs    # sessão: corrida de refresh, logout-all
node apps/api/scripts/smoke-google.mjs     # OAuth: redirect_uri, scope, state/CSRF
node apps/api/scripts/smoke-friends.mjs    # amigos e DM: pedido, aceite, privacidade
node apps/api/scripts/smoke-upload.mjs     # upload: presign, PUT direto no R2, leitura pública
node apps/api/scripts/smoke-voice.mjs      # voz: token do SFU, várias abas, reload, fantasmas
node apps/api/scripts/smoke-permissoes.mjs # cargos: hierarquia, overwrites, canal invisível
node apps/api/scripts/smoke-webhooks.mjs   # webhooks: postar sem login, vazão, apagar
node apps/api/scripts/smoke-mensagens.mjs  # fixar, spoiler, enquete, modo lento
node apps/api/scripts/smoke-forum.mjs      # fórum: assunto, resposta, ordem, fechar
node apps/api/scripts/smoke-expressoes.mjs # emoji, figurinha e som do servidor
node apps/api/scripts/smoke-moderacao.mjs  # banir, castigo, automod e auditoria
node apps/api/scripts/smoke-desktop.mjs   # login do app: desafio, código de uso único, PKCE
node apps/api/scripts/fake-friend.mjs CODE # simula um amigo entrando por convite e conversando
node apps/api/scripts/fake-voice.mjs EMAIL # coloca alguém num canal de voz (sem mídia)
```

São 48 testes de unidade (vitest: 24 na API — services com repository mockado, o
filtro do AutoMod e o código de login do desktop —, 14 do cálculo de permissões e
10 da porta de voz) e 166 verificações end-to-end, e cada `ok` corresponde a um comportamento que já
quebrou uma vez. Rode todos antes de mexer em auth, mensagens, presença ou voz.

Os scripts apagam o servidor que criam ao terminar. Para limpar sobras antigas:

```bash
yarn workspace @gravae/api limpar                          # apaga os "Teste …"
GUILDS_MANTER=<id> yarn workspace @gravae/api limpar        # mantém só esses
```

Em desenvolvimento as stores ficam no console do navegador:
`__gravae.chat.getState()`, `__gravae.voice.getState()`, `__gravae.socket()`.
Depurar estado de tempo real sem isso é adivinhação.

## Login com Google

Fluxo server-side com `@fastify/oauth2`. O botão leva a `/api/auth/google`, o
Google devolve em `/api/auth/google/callback`, e a API grava o cookie de refresh
e redireciona pro app.

O `redirect_uri` é montado a partir da requisição: `x-forwarded-host` quando vem
por proxy (ngrok, Caddy), senão `API_PUBLIC_URL`. As duas formas correspondem às
duas URIs cadastradas no console do Google.

**O access token nunca vai na URL.** Só o cookie httpOnly é gravado, e o front
pega o access no bootstrap com `POST /auth/refresh` — token em query string vaza
pro histórico, pro `Referer` e pros logs de qualquer proxy no caminho.

## Aplicativo de desktop

```bash
yarn desktop      # com o `yarn dev` já rodando
```

O app é uma **casca em volta do mesmo front** que roda no navegador — não uma
cópia empacotada. Carregando por http a origem é a mesma, então cookie de
sessão, CORS e o callback do Google se comportam exatamente como no navegador
já testado. `GRAVAE_APP_URL` no `.env` aponta pra onde carregar (na Fase 6, o
endereço público).

**Permissões do macOS vêm antes das do Chromium.** Microfone, câmera e gravação
de tela são liberados por app nos *Ajustes do Sistema*, e sem isso o
`getUserMedia` falha calado — a tela acusava "permissões do navegador" por causa
de uma caixinha desmarcada em outro lugar. Agora o app pede a permissão do
sistema antes de capturar e, quando ela já foi negada (o pedido nativo só
aparece uma vez), mostra o botão que abre o painel certo.

⚠️ **Em desenvolvimento o app aparece como "Electron"** nessas listas, não como
"Gravaê": quem executa é o Electron cru. As mensagens do app já dizem o nome
certo — vem de `nomeNoSistema` na ponte. Como o TCC é por bundle id, um "não
permitir" dado a qualquer app Electron vale para todos eles.

Três coisas que só existem aqui, porque o navegador não deixa:

- **Push-to-talk global.** Com a janela em foco quem manda continua sendo o
  front (ele sabe se você está digitando no chat); fora de foco — o jogo em
  primeiro plano — o gancho nativo assume. No macOS isso exige o Gravaê em
  *Ajustes do Sistema → Privacidade e Segurança → Acessibilidade*, e a tela de
  Voz e vídeo tem o botão que leva até lá.
- **Seletor de tela com o som do sistema.** O `getDisplayMedia` passa pelo
  processo principal, que lista telas e janelas de verdade; o seletor é nosso
  (com a cara do app) e a captura sai com `loopback` — o som do jogo vai junto,
  o que no navegador não existe: de lá só sai o som da *aba*.
- **Login com Google por deep link.** O Google recusa a tela de consentimento
  dentro de janela embutida, e com razão. O consentimento acontece no navegador
  do sistema e volta por `gravae://auth?codigo=...`; o código é de uso único e
  só vira sessão junto com um *verificador* que nunca saiu do app (PKCE) — sem
  isso, qualquer programa registrado no mesmo esquema entraria na sua conta.
  O navegador não ganha sessão nenhuma nesse caminho.

### Empacotar

```bash
yarn workspace @gravae/desktop empacotar   # gera release/Gravaê Chat.app + .dmg
```

Empacotar aqui **não é sobre distribuição — é sobre identidade**. Em
desenvolvimento o executável é o Electron genérico, e o macOS guarda as
permissões debaixo de quem lançou o processo: microfone e gravação de tela
ficavam negados sem o app sequer aparecer nas listas de Privacidade, e não havia
como adicioná-lo à mão. Empacotado, ele vira `Gravaê Chat` com `appId`
`io.gravae.chat`, pede as permissões sozinho e aparece na lista com o nome dele.

Dois detalhes que custaram tempo e estão resolvidos na configuração:

- **`npmRebuild: false`** — o `uiohook-napi` é N-API e já vem com o `.node` de
  cada plataforma. Recompilar não só é desnecessário como quebra: o node-gyp
  depende do Python do sistema, e o do homebrew está com o `pyexpat` corrompido.
- **assinatura ad-hoc no `afterPack`** (`build/assinar-adhoc.cjs`) — sem ela o
  app herda a assinatura do Electron e fica com `Identifier=Electron`, que é
  exatamente o que o TCC usa pra guardar a permissão. Sem esse passo, empacotar
  não resolveria nada.

Sem conta de desenvolvedor Apple não há assinatura de verdade nem notarização —
o que basta para uso local, mas o `.dmg` mandado pra outra máquina esbarra no
Gatekeeper.

## Marca

A paleta vem do backoffice (`GravaeV2/backoffice/src/styles/global.css`) e mora
num lugar só: o bloco `@theme` de `apps/web/src/styles/index.css`. Todo o app usa
`bg-surface-1`, `text-ink-muted` e afins em vez de cor solta, então trocar a
identidade é trocar aquele bloco. Antes eram as cores do Discord, copiadas tal e
qual.

Uma decisão que o vermelho da marca obrigou: **`danger` não pode ser o mesmo
vermelho do `brand`**, senão "Excluir servidor" e o botão primário viram o mesmo
botão. `brand` é o `#d30404` do ponto da marca; `danger` é um tom mais claro
(`#f13a3a`), que grita mais alto.

Os arquivos ficam em `apps/web/public/brand/` (marca, logotipo, ícone e o fundo
da tela de login, reduzido de 4000×4000/2,7 MB para 1200×1200/320 KB). O ícone
do aplicativo de desktop é gerado a partir do mesmo PNG em
`apps/desktop/build/icon.icns`.

## Decisões que valem saber

**React Query é o dono dos dados do servidor; o socket escreve no cache dele.**
Não existe store paralela pra reconciliar: `use-realtime` recebe o evento e faz
`setQueryData` na mesma chave que o HTTP preencheu. Zustand ficou só para o que
não é do servidor — a sessão de mídia do LiveKit e o "está digitando".

**Enviar mensagem vai por WebSocket, não por HTTP.** A mensagem precisa ser
distribuída pra sala inteira de qualquer forma; um POST faria a viagem duas
vezes. A mutation do React Query cuida do otimista e do erro, e o `mutationFn`
emite pelo socket.

**Sessão diverge do backoffice de propósito.** O backoffice guarda access e
refresh token no `localStorage`; aqui o access fica só em memória e o refresh num
cookie `httpOnly`. Um XSS lê `localStorage`; não lê cookie `httpOnly`. A forma do
`@core/lib/api.ts` é a mesma (instância axios + interceptor de refresh com fila),
só o armazenamento muda.

**Mongo em replica set.** O Prisma exige replica set (mesmo de um nó) pra
transações. O `healthcheck` do container roda o `rs.initiate()` sozinho na
primeira subida. A `DATABASE_URL` usa `directConnection=true` porque o membro do
set se anuncia como `mongo:27017`, hostname que só existe dentro do Docker.

**Estado de voz no Redis, não no Mongo.** Quem está em qual canal, mutado ou com
câmera ligada é efêmero e tem que sumir sozinho se o processo cair. No banco,
isso vira "fantasma" permanente na lista do canal.

**Dois planos de mídia.** Voz/câmera/tela usam WebRTC (LiveKit self-hosted,
Fase 3). RTMP é só pra ingestão do OBS (Fase 4) — RTMP não serve pra conversa,
é unidirecional e tem segundos de atraso.

**Versões fixadas** (Prisma 6, TypeScript 5.9, Vite 7) em vez de `latest`.
Prisma 7 e TS 7 são releases recentes com breaking changes; a atualização é uma
tarefa própria, não algo pra descobrir no meio de uma feature.

### Três armadilhas que já custaram tempo aqui

**`campo: null` no Prisma + MongoDB não encontra nada.** No Mongo, "campo
ausente" e "campo null" são estados diferentes, e o Prisma não grava campos
opcionais que nunca receberam valor. Um `where: { deletedAt: null }` devolvia
zero mensagens — sem erro, silenciosamente. Use sempre o helper
`unset("campo")` de `apps/api/src/lib/mongo.ts`.

**Rotação de refresh token + StrictMode = logout.** O React executa o efeito
duas vezes em desenvolvimento; dois refresh saíam juntos com o mesmo cookie e o
segundo chegava com o token já rotacionado. Resolvido dos dois lados: um único
refresh em voo no cliente (`refreshSession` em `lib/api.ts`) e uma janela de
tolerância de 30s no servidor — que NÃO vale para logout de verdade, senão
anularia o "sair de todos os dispositivos".

**Rejeição não tratada derruba a API inteira.** Duas conexões do mesmo usuário
escrevendo no mesmo documento dão `P2034` (write conflict) no Mongo; num
`void promise` sem `.catch()` isso vira rejeição não tratada e o Node 22 encerra
o processo — todo mundo cai por causa de um erro isolado. Todo disparo em
background leva `.catch()`, e `server.ts` tem uma rede de segurança que loga em
vez de morrer.

**Foto do Google exige `referrerPolicy="no-referrer"`.** O
`lh3.googleusercontent.com` responde 403 quando o navegador manda `Referer` de
outra origem, e aí o `<img>` cai no texto alternativo — que vazava como texto
solto por cima do layout. O `Avatar` também troca para a inicial no `onError`,
em vez de deixar o `alt` aparecer.

**Imagem é comprimida no navegador antes de subir** (`lib/image.ts`): 1600px
para anexo, 256px para avatar, em webp. Um print de 6 MB vira ~600 KB; uma foto
de celular vira ~15 KB como avatar. Subir o original gastaria banda, R2 e o
tempo de quem envia, para exibir algo que ninguém vê no tamanho original.

**O anexo sobe pela API enquanto o R2 não tiver CORS.** Upload direto do
navegador pro bucket é mais barato (o binário não passa pela API), mas o R2
recusa `PUT` de outra origem sem política de CORS — e isso só aparece no
navegador, porque o Node não aplica CORS. Rode
`node apps/api/scripts/setup-r2-cors.mjs` para ver a política a colar em
**R2 → bucket → Settings → CORS Policy**; depois é só ligar `R2_DIRECT_UPLOAD=true`.

**A mensagem reserva o espaço da imagem antes dela carregar.** As dimensões vão
junto com o anexo (medidas na hora da compressão); sem isso, cada imagem que
chega empurra a conversa enquanto você lê.

**Conversa privada exige amizade aceita.** Sem essa regra, qualquer pessoa com
um id de usuário abriria uma DM e mandaria mensagem. O canal de DM é um `Channel`
sem `guildId`, com os dois ids em `recipients` — a mesma checagem de acesso do
resto do chat já cobre isso.

**Storage é o R2, com prefixo.** O token do R2 que temos tem escopo de UM bucket,
compartilhado com outro produto — não dá pra criar um bucket próprio por aqui.
Por isso todo arquivo vai sob `R2_PREFIX` (`gravae-chat/`). Quando houver um
bucket dedicado, é só trocar `R2_BUCKET` e limpar o prefixo. O binário nunca
passa pela API: o navegador faz PUT direto na URL assinada.

**Perfil de outra pessoa só é visível para quem compartilha um servidor ou já é
amigo**, e um estranho recebe 404 — não confirma nem que a conta existe. O app é
um espaço fechado entre amigos, não um diretório de usuários.

**O filtro de ruído (Krisp) fica em cache depois do primeiro carregamento.** São
~2 MB de WebAssembly: baixar a cada clique no botão fazia parecer que o filtro
"não pegava". Agora o módulo é pré-carregado ao entrar na chamada e o botão
mostra que está aplicando em vez de acender antes da hora.

**O áudio da chamada vive fora das rotas** (`VoiceAudioSink`, montado no `App`).
Os elementos `<audio>` moravam dentro da tela do canal de voz; ao navegar para um
canal de texto a tela desmontava, os elementos saíam do DOM e o som parava no
meio da conversa — com a chamada ainda conectada.

**Reload não pode te tirar da chamada.** O socket cai no F5, mas o estado fica
"órfão" por 12s em vez de ser apagado. A aba que volta pede `voice:join` com
`resume: true`, e **o servidor decide** se é retomada ou roubo — se outra aba
estiver ao vivo na chamada, recusa. Decidir isso no cliente, por um flag que
chega por evento, é uma corrida que se perde na metade das vezes.

**Estado de voz é por conta, mas quem segura a chamada é uma conexão.** A mesma
conta pode ter várias abas abertas; só uma tem a sessão de mídia. Por isso o
estado no Redis guarda o `socketId` de quem entrou: sem ele, fechar qualquer aba
parada apagava o estado da conta e derrubava a chamada de quem estava falando.
Na interface isso aparece como "Em chamada em outra aba", com a opção de trazer
— clicar num canal de voz em que a conta já está NÃO rouba a chamada sozinho,
porque entrar com a mesma identidade derruba a sessão de mídia da outra aba.

**Presença precisa vir do Redis, não do campo no Mongo.** O broadcast só
acontece na transição 0→1 sessões, então um segundo socket do mesmo usuário
nunca recebe o evento. O snapshot lê `getPresenceMap` do Redis; os eventos
cuidam só das mudanças dali pra frente.

## Estado

- [x] Fase 0 — fundação (monorepo, infra, schema, health)
- [x] Fase 1 — login com Google
- [x] Fase 2 — servidores, canais e chat em tempo real
- [x] Fase 3 — voz, webcam e tela
- [x] Amigos e conversas privadas (DM)
- [x] Anexos no chat (arrastar, colar ou escolher — com compressão)
- [x] Cargos, permissões e permissões por canal
- [x] Configurações do usuário: dispositivos, volumes, limiar e push-to-talk
- [x] Webhooks e integrações
- [x] GIF, figurinha e emoji (do servidor e unicode) no compositor
- [x] Fixar mensagem, anexo com spoiler, enquete e modo lento
- [x] Canal de fórum com assunto e conversa própria
- [x] Chat dentro do canal de voz e menu do botão direito na chamada
- [x] Moderação: auditoria, banimentos, AutoMod e castigo
- [x] Barras laterais com largura arrastável (guardada por tela, no navegador)
- [x] Identidade do Gravaê: paleta, logotipo, favicon, ícone do app e tela de login
- [x] Busca de GIF pela KLIPY (a Tenor foi desligada pelo Google em 30/06/2026)
- [ ] Fase 4 — Go Live por RTMP
- [x] Fase 5 — app desktop: push-to-talk global, tela com áudio do sistema, deep link
- [ ] Fase 6 — deploy no VPS com Cloudflare

Backlog detalhado: `PROXIMA_SESSAO.md`

## Emoji

Os emoji são do **[Twemoji](https://github.com/jdecked/twemoji)**, o mesmo
conjunto que o Discord usa — e por um motivo prático, não estético: sem um
conjunto próprio, quem desenha é a fonte do sistema (`Apple Color Emoji`,
`Segoe UI Emoji`), e o MESMO emoji chega diferente para cada pessoa da conversa.

Os SVGs vêm do pacote `@twemoji/svg` e são copiados para `apps/web/public/emoji/`
pelo `scripts/copiar-emoji.mjs`, que roda sozinho no `predev` e no `prebuild`.
A pasta é derivada e **não entra no git** (16 MB, 3.723 arquivos).

**Licença, e ela importa:** o pacote npm declara MIT, mas isso é do
empacotamento. A ARTE do Twemoji é **CC-BY 4.0** (Twitter, Inc. e outros
colaboradores), e CC-BY exige atribuição.

A atribuição vive em [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md) e em
`apps/web/public/licencas/`, que é publicado junto com o app — em produção,
`/licencas/twemoji-NOTICE.md`.
