# Gravaê Chat

Chat de comunidades: servidores, canais de texto, voz e fórum, webcam,
compartilhamento de tela, amigos e conversas privadas, bots e webhooks. Roda no
navegador e como app de desktop (Electron).

## Rodar local

Precisa de Node 22+, Yarn 1 (`yarn@1.22`) e Docker.

```bash
yarn install
cp .env.example .env      # ajuste o que o arquivo pede (Google, R2, LiveKit)
yarn infra:up             # mongo (replica set) + redis + livekit + minio
yarn db:push              # cria as collections e os índices
yarn dev                  # api :3333  +  web :5173
yarn desktop              # app de desktop em cima do mesmo :5173
```

- Web: http://localhost:5173
- API: http://localhost:3333/api/health
- LiveKit: ws://localhost:7880 (mídia em UDP 7882, fallback TCP 7881)

Os serviços do Docker só escutam em `127.0.0.1`. **O Redis local fica na 6381**,
não na 6379: se já houver um Redis na máquina, o container perderia a porta sem
erro e a API falaria com o Redis errado.

`yarn infra:reset` derruba os containers **e apaga os volumes** (banco zerado).

## Estrutura

```
apps/
├── api/        Fastify + Prisma (MongoDB) + Socket.IO
├── web/        React + Vite + React Query + Tailwind
├── desktop/    Electron: casca em volta do mesmo front
└── landing/    site de apresentação (Next.js)
packages/
├── shared/     tipos, schemas Zod e o contrato dos eventos de tempo real
└── bot/        cliente de bot: REST e tempo real com os tipos do servidor
infra/          docker-compose local, staging, SFU e o receptor de publicação
```

```
apps/api/src/
├── routes/         controllers finos: validam, chamam o service, publicam o evento
├── services/       regra de negócio; não conhecem Fastify nem Socket.IO
├── repositories/   único ponto de acesso ao banco
├── validations/    schemas Zod de entrada
├── realtime/       gateway Socket.IO e handlers (chamam os mesmos services)
└── lib/            erros de domínio, prisma, redis, serialização, segurança

apps/web/src/
├── @core/                  requests (axios), queries (React Query), models e websocket
├── features/<assunto>/     componentes, hooks, stores e lib de um assunto só
│   (amizades · app · configuracoes · conversa · descoberta · expressao
│    perfil · servidor · tema · voz)
├── components/ui/          primitivas compartilhadas
├── hooks/ lib/ stores/     o que mais de uma feature usa
└── pages/presentation/     as telas que montam as features
```

A regra de onde algo mora: **quem importa isto?** De um assunto só, vai para a
feature; de vários, fica na raiz.

Os dois apps usam o alias `~`. `packages/shared` é consumido como TypeScript cru:
todo evento de tempo real é declarado em `packages/shared/src/events.ts`, então
front e back divergentes viram erro de compilação.

O código é em inglês e sem comentários; o porquê das decisões fica nas mensagens
de commit (`git log -S "trecho"`). Em português ficam só o texto que a pessoa lê
e o vocabulário de tema.

## Testes

```bash
yarn test          # vitest em todos os pacotes
yarn typecheck
```

Além dos testes de unidade, `apps/api/scripts/smoke-*.mjs` exercitam a API de
ponta a ponta (auth, socket, refresh, Google, amigos, upload, voz, permissões,
webhooks, mensagens, fórum, expressões, moderação, desktop e bots). Rode os que
tocam no que você mudou, principalmente em auth, mensagens, presença ou voz.

```bash
node apps/api/scripts/smoke-socket.mjs
yarn workspace @gravae/api limpar      # apaga servidores de teste que sobraram
```

Em desenvolvimento as stores ficam no console do navegador:
`__gravae.chat.getState()`, `__gravae.voice.getState()`, `__gravae.socket()`.

## Branches e publicação

`dev` → `staging` → `master`. O `master` é produção.

- **Front:** a Vercel publica cada branch. `staging` tem domínio próprio; o
  `master` é produção.
- **API de staging:** `infra/staging/publicar.sh`, a partir da branch `staging`.
- **API de produção:** o workflow `API` roda no merge para o `master` e espera a
  aprovação do ambiente `producao`. O pacote vai para um script fixo na VM
  (`infra/publicacao/receber-publicacao.sh`), com versões fixas e sem scripts de
  instalação.
- **Desktop:** `gh workflow run desktop.yml -f tag=vX.Y.Z` gera `.dmg` e `.exe`.
- **Backup:** o workflow `Backup do banco` faz um `mongodump` diário, cifrado,
  para um bucket privado, e guarda 30 dias.

O front fala com a API pelo rewrite da Vercel (`apps/web/vercel.ts`), então web e
API respondem pela mesma origem. O rewrite manda um cabeçalho secreto
(`EDGE_SECRET`) e só com ele a API confia no IP do cliente repassado pela Vercel.

## Segurança

- Access token só em memória; refresh token em cookie `httpOnly`, guardado como
  hash e rotacionado. Reusar um refresh antigo derruba todas as sessões.
- Trocar a senha ou sair de todos os aparelhos invalida na hora os tokens e os
  sockets dos outros aparelhos.
- Permissão de canal é checada num lugar só (`access-service`), inclusive a de
  que o canal pertence ao servidor da rota.
- Anexo só aceita arquivo que a própria pessoa enviou; HTML/SVG/JS são servidos
  como texto.
- Embeds validam cada redirecionamento contra IP interno; o player só abre de
  sites conhecidos, em sandbox.
- Limite de requisições por usuário (ou por IP, sem login), limite por evento no
  socket e bloqueio de 15 minutos após 10 senhas erradas numa conta.

Achou uma falha? Não abra issue pública: fale direto com o mantenedor.

## Aplicativo de desktop

O app carrega o mesmo front por http, então cookie, CORS e login se comportam
como no navegador. Três coisas só existem nele:

- **Push-to-talk global**, com o app fora de foco (no macOS pede Acessibilidade).
- **Tela com o som do sistema**: a captura sai com `loopback`.
- **Login com Google por deep link** (`gravae://`), com código de uso único e
  verificador PKCE.

```bash
yarn workspace @gravae/desktop empacotar
```

Empacotar dá ao app identidade própria (`io.gravae.chat`) para as permissões do
macOS. A assinatura é ad-hoc e muda a cada build, então depois de atualizar pode
ser preciso desmarcar e marcar de novo a permissão de gravação de tela. A
correção definitiva é uma assinatura Developer ID.

## Decisões que valem saber

**React Query é o dono dos dados do servidor; o socket escreve no cache dele.**
`use-realtime` recebe o evento e faz `setQueryData` na mesma chave que o HTTP
preencheu. Zustand fica para o que não é do servidor: mídia do LiveKit, "está
digitando".

**Enviar mensagem vai por WebSocket.** A mensagem é distribuída para a sala de
qualquer forma; um POST faria a viagem duas vezes.

**Estado de voz no Redis, não no Mongo.** É efêmero e tem que sumir se o processo
cair. O estado guarda o `socketId` de quem segura a chamada: fechar outra aba da
mesma conta não derruba quem está falando, e o reload retoma a chamada por 12s.

**Presença vem do Redis.** O broadcast só acontece na transição de 0 para 1
sessão; o snapshot inicial lê o mapa do Redis.

**Mongo em replica set**, porque o Prisma exige para transações. O healthcheck do
container roda o `rs.initiate()` na primeira subida.

**Voz com filtro de ruído no navegador** (RNNoise em WebAssembly). Não fala com
servidor nenhum e não tem limite de minutos.

**Imagem é comprimida no navegador antes de subir** (`lib/image.ts`): 1600px para
anexo, 256px para avatar, em webp. As dimensões vão junto, para a mensagem
reservar o espaço antes da imagem carregar.

**Anexo sobe pela API** enquanto o bucket não tiver CORS. Para upload direto,
`node apps/api/scripts/setup-r2-cors.mjs` mostra a política e depois é ligar
`R2_DIRECT_UPLOAD=true`.

**Versões fixadas** (Prisma 6, TypeScript 5.9, Vite 7). Atualizar major é tarefa
própria.

### Armadilhas que já custaram tempo

- **`campo: null` no Prisma + MongoDB não encontra nada.** Campo ausente e campo
  null são coisas diferentes no Mongo. Use `unset("campo")` de
  `apps/api/src/lib/mongo.ts`.
- **Rotação de refresh + StrictMode.** Dois refresh saem juntos em
  desenvolvimento. Há um único refresh em voo no cliente e 30s de tolerância no
  servidor.
- **Rejeição não tratada derruba a API.** Todo disparo em background leva
  `.catch()`, e `server.ts` loga em vez de morrer.
- **Foto do Google exige `referrerPolicy="no-referrer"`**, senão volta 403.
- **O áudio da chamada vive fora das rotas** (`VoiceAudioSink`): dentro da tela
  do canal, navegar para um canal de texto cortava o som.
- **Link cru para `/api/...` no front ignora a base da API.** Fora do axios, use
  `BASE_DA_API`, senão o staging fala com a produção.
- **A Vercel não aceita misturar regra com transformação, `rewrites` e `headers`.**
  O `vercel.ts` usa uma lista única de `routes`.

## Estado

- [x] Servidores, canais de texto, voz e fórum, chat em tempo real
- [x] Login com e-mail e Google, amigos e conversas privadas
- [x] Voz, webcam e tela com LiveKit próprio
- [x] Cargos, permissões por canal, moderação, AutoMod e auditoria
- [x] Anexos, GIF (KLIPY), figurinhas, emoji e sons do servidor
- [x] Webhooks, bots e OAuth para aplicativos
- [x] Temas do usuário e estúdio de temas
- [x] App de desktop: push-to-talk global, tela com som do sistema, deep link
- [x] Produção com staging, deploy aprovado e backup diário
- [ ] Go Live por RTMP

## Emoji e licenças

Os emoji são do [Twemoji](https://github.com/jdecked/twemoji), para que o mesmo
emoji apareça igual para todo mundo. Os SVGs são copiados de `@twemoji/svg` para
`apps/web/public/emoji/` no `predev` e no `prebuild` (a pasta fica fora do git).

A arte do Twemoji é **CC-BY 4.0** e exige atribuição, que está em
[`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md) e é publicada com o app em
`/licencas/twemoji-NOTICE.md`.
