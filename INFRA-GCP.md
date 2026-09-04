# Gravaê Chat — infraestrutura de produção

Documento para quem vai provisionar. Descreve **o que precisa existir**, não o
passo a passo de instalação.

Topologia: **front na Vercel**, e **uma VM só** com API, banco, Redis e o SFU,
rodando `docker compose` com um proxy HTTPS na frente. Não é arquitetura
distribuída e não precisa ser — o app é para um grupo de amigos, com 30 pessoas
por sala no limite configurado.

## Como ler este documento

Cada item vem marcado, porque nem tudo aqui é trabalho novo:

| Marca | Significa |
|---|---|
| ✅ | **Já está no código.** Não precisa fazer nada, é só saber que existe. |
| 🔧 | **Falta construir.** Arquivo ou configuração que ainda não existe no repositório. |
| 👤 | **Depende do dono do projeto** — painel de terceiro, conta, domínio. |

---

## O que é a aplicação

| Peça | O que é | Onde roda |
|---|---|---|
| **Front** | React buildado pelo Vite — arquivos estáticos | **Vercel** |
| **API** | Fastify (Node 22) + Socket.IO. Sessão em cookie `httpOnly`. | VM, porta 3333 |
| **MongoDB** | banco, via Prisma | VM, porta 27017 |
| **Redis** | presença, limites de vazão, coordenação do SFU | VM, porta 6379 |
| **LiveKit** | SFU: recebe áudio/vídeo de cada pessoa e redistribui | VM, portas 7880/7881/7882 |

Anexos e avatares **não** ficam na máquina: vão para o **Cloudflare R2** ✅.

---

## 1. Os três domínios — e a armadilha do cookie

Front e API passam a viver em origens diferentes. Isso é seguro **desde que os
dois fiquem sob o mesmo domínio registrável**.

| Nome | Aponta para | Proxy da Cloudflare |
|---|---|---|
| `chat.<dominio>` | CNAME da Vercel | conforme a Vercel instruir |
| `api.<dominio>` | IP da VM | laranja (proxy ligado) — WebSocket passa |
| `sfu.<dominio>` | IP da VM | **cinza — DNS only, obrigatório** |
| `rtmp.<dominio>` | IP da VM (fase futura, OBS) | **cinza — DNS only, obrigatório** |

> ⚠️ **O front NÃO pode ficar num endereço `*.vercel.app`.** 👤
>
> A sessão é um cookie `httpOnly` com `sameSite: "lax"`
> (`apps/api/src/routes/auth.ts`). `Lax` não é enviado em requisição
> *cross-site*, e "site" quer dizer domínio registrável. Como `vercel.app` está
> na Public Suffix List, `gravae.vercel.app` conta como um site **próprio** —
> o cookie de refresh não seria enviado para `api.<dominio>` e **a sessão
> morreria no primeiro reload**.
>
> Com `chat.<dominio>` (domínio próprio apontado para a Vercel) os dois ficam
> sob o mesmo site, o cookie `Lax` funciona e **nenhuma linha de código muda**.
>
> A alternativa — `SameSite=None; Secure` — é cookie de terceiros: o Safari já
> bloqueia e o Chrome está caminhando para isso. Quebraria de forma
> intermitente para parte dos usuários.

> ⚠️ **O proxy laranja da Cloudflare não passa UDP nem a porta 1935.** Se o
> subdomínio do SFU ficar laranja, a mídia não passa e a chamada fica muda.

O código já está pronto para origens diferentes: `withCredentials: true` no
axios ✅, CORS com allowlist vinda de `WEB_ORIGIN` ✅
(`apps/api/src/lib/origins.ts`), e o Socket.IO autentica por token no handshake
em vez de cookie ✅.

---

## 2. Front na Vercel

- Raiz do projeto: `apps/web` (é um monorepo com Turbo + yarn workspaces) 🔧
- Build: `vite build` ✅ · saída em `dist`
- **Rewrite de SPA** 🔧 — o app usa `react-router` 7 com history de navegador.
  Sem um `vercel.json` mandando tudo para o `index.html`, link direto para uma
  rota interna dá 404. A preset de Vite da Vercel costuma resolver sozinha, mas
  deixar explícito elimina o risco.
- Variáveis de ambiente, **no projeto da Vercel** 👤:

```
VITE_API_URL=https://api.<dominio>
VITE_WS_URL=https://api.<dominio>
```

> ⚠️ **`VITE_*` é embutido no bundle durante o build, não lido em execução.**
> Definir essas variáveis no servidor depois do build não faz absolutamente
> nada. Elas têm que estar configuradas na Vercel antes do deploy.

O plano gratuito da Vercel dá 100 GB/mês — folgado para um build de ~8 MB.

---

## 3. A máquina

| | |
|---|---|
| Serviço | **Compute Engine** (VM) — **não** Cloud Run |
| Tipo | `e2-medium` (2 vCPU, 4 GB) |
| Imagem | Ubuntu 24.04 LTS |
| Disco | 50 GB `pd-balanced` |
| Região | `southamerica-east1` (São Paulo) |
| **Network Tier** | **Standard** (ver seção 8 — corta ~30% do egress) |

**Por que Compute Engine e não Cloud Run.** O LiveKit precisa receber **UDP** e
manter conexão aberta por toda a duração da chamada. Cloud Run não faz nem um
nem outro. Nenhuma configuração contorna isso.

**Por que São Paulo.** Latência é o que mais se percebe em chamada de voz. São
Paulo custa mais que `us-east1`, mas dá ~10 ms contra ~120 ms para quem está no
Brasil. Vale a diferença — e é o motivo de não usarmos um provedor europeu
barato.

**Sobre a CPU.** O LiveKit **não transcodifica**, só reencaminha pacotes. Duas
vCPUs aguentam o grupo com folga. O que consome recurso é o Mongo.

---

## 4. Rede

### IP externo estático 🔧

Reservar um. Com IP efêmero, o endereço muda a cada reinício da VM e o DNS
quebra — e, pior, o LiveKit passa a anunciar um IP que não existe mais, o que dá
chamada que conecta e fica muda.

### Regras de firewall (VPC) 🔧

| Porta | Protocolo | Para quê | Origem |
|---|---|---|---|
| 22 | TCP | SSH | **restringir ao IP da equipe** |
| 80 | TCP | HTTP (redireciona para 443 e resolve o desafio do Let's Encrypt) | 0.0.0.0/0 |
| 443 | TCP | API + WebSocket | 0.0.0.0/0 |
| 7881 | TCP | WebRTC via TCP, para quem tem UDP bloqueado | 0.0.0.0/0 |
| **7882** | **UDP** | **mídia da chamada — o caminho normal** | 0.0.0.0/0 |
| 3478 | UDP | TURN, para NAT mais restritivo | 0.0.0.0/0 |
| 1935 | TCP | RTMP (só quando o "Go Live" com OBS entrar) | 0.0.0.0/0 |

> ⚠️ **Esquecer a 7882/UDP é o erro clássico.** O sintoma engana: a chamada
> conecta, todo mundo aparece na sala, e fica **muda para sempre**. Nada no log
> da API acusa. Se acontecer, é firewall antes de qualquer outra hipótese.

---

## 5. Dados

### MongoDB

Roda no compose, com volume em disco persistente. 🔧

> ⚠️ **Precisa ser um replica set, mesmo com um nó só.** O Prisma exige replica
> set para transações; sem isso o `prisma db push` falha com "Transactions are
> not supported". O `infra/docker-compose.yml` de desenvolvimento já resolve
> isso ✅ com um truque: o próprio `healthcheck` roda o `rs.initiate()` na
> primeira subida. Vale reaproveitar a mesma abordagem em produção.

Alternativa: **MongoDB Atlas M0 (gratuito)** — tira o backup do nosso colo e já
vem como replica set. Muda só a `DATABASE_URL`.

### Redis

Roda no compose, `--appendonly yes`, volume no mesmo disco. 🔧

> Nota de desenvolvimento que **não** se aplica em produção: na máquina local o
> Redis está publicado na porta **6381** (a 6379 já estava ocupada). Na VM pode
> usar a 6379 — e ela **não** deve ser exposta no firewall.

---

## 6. Storage dos anexos — ✅ já resolvido, não precisa provisionar

Anexos, avatares e imagens do chat vão para o **Cloudflare R2**, que **já está
configurado e em uso**, inclusive em desenvolvimento. Não há nada para criar no
GCP para isso.

- O bucket é compartilhado com outro produto e isolado por prefixo
  (`R2_PREFIX=gravae-chat`) ✅
- O upload já vai **direto do navegador para o bucket** por URL assinada, sem
  passar pelo Node ✅ (`apps/api/src/services/upload-service.ts`)
- As imagens já são **comprimidas no navegador** antes de subir — redimensiona e
  converte para WebP ✅ (`apps/web/src/lib/image.ts`)
- As imagens são servidas **direto do R2**, não pela VM ✅ — é por isso que elas
  custam ~US$ 0 de egress
- O `MinIO` do `infra/docker-compose.yml` é só um plano B para rodar sem
  internet em desenvolvimento. **Não entra no compose de produção.**

**Pendência 👤:** falta colar a política de CORS no painel do R2. Enquanto não
estiver, `R2_DIRECT_UPLOAD` fica `false` e todo anexo sobe *pela API* — entra na
VM, é bufferizado em memória e sai de novo rumo ao R2. O script
`apps/api/scripts/setup-r2-cors.mjs` ✅ imprime a política pronta para colar em
R2 → bucket → Settings → CORS Policy.

**Pendência 🔧:** nada nunca apaga do R2 — não existe um `DeleteObjectCommand`
no projeto. Mensagem apagada, avatar trocado e figurinha removida deixam o
objeto no bucket para sempre. Barato (~US$ 0,015/GB por mês), mas cresce sem
parar.

---

## 7. Dentro da VM

- **Docker** + **Docker Compose** 🔧
- **`docker-compose.prod.yml`** 🔧 — não existe ainda. Deriva do de
  desenvolvimento: sem MinIO, sem portas publicadas para Mongo e Redis, com
  volumes em disco persistente.
- **Caddy** como proxy reverso 🔧 — HTTPS automático, sem certbot na mão:

| De | Para |
|---|---|
| `api.<dominio>/*` | API na 3333 (precisa passar WebSocket) |
| `sfu.<dominio>` | LiveKit na 7880 (WebSocket de sinalização) |

> O front **não** passa por aqui — está na Vercel. E o tráfego de mídia **não
> passa pelo Caddy**: vai direto nas portas 7882/UDP e 7881/TCP.

---

## 8. Custo — e como mantê-lo baixo

O custo tem duas naturezas opostas:

- **Fixo:** a VM é cobrada por hora que existe, ligada. CPU a 5% ou a 95% custa
  o mesmo. **Processar as chamadas não custa nada a mais.**
- **Variável:** cada GB que *sai* da VM para a internet. É só isso que cresce
  com o uso.

O que gera saída é o SFU reenviando mídia. A conta é
**bitrate × quantidade de gente assistindo** — e é por isso que dobrar o grupo
multiplica por quatro, não por dois.

Imagens e avatares **não entram nessa conta**: saem do R2, que não cobra egress.

### Base fixa

| Item | Por mês |
|---|---|
| `e2-medium` em São Paulo | ~US$ 35 |
| Disco 50 GB `pd-balanced` | ~US$ 7 |
| IP externo estático | ~US$ 4 |
| Front na Vercel | US$ 0 (plano gratuito) |

### As cinco alavancas de egress

**1. Network Tier Standard em vez de Premium** 🔧 — **–30%**. É um seletor na
criação da VM. O Premium roteia pela rede privada do Google até o ponto mais
próximo do destino; com a VM em São Paulo e os usuários no Brasil, é uma
otimização de rota que não se usa.

**2. Codec: VP9 (ou AV1) em vez de VP8** 🔧 — **–30%**. O projeto não define
`publishDefaults`, então usa o padrão do LiveKit, que é VP8 por
compatibilidade. VP9 entrega a mesma qualidade com menos bits; AV1 vai além e é
especialmente bom com conteúdo de tela. Custo: AV1 pesa na CPU de quem
transmite. VP9 é o meio-termo seguro.

**3. Tela em `h720fps30` em vez de `h1080fps15`** 🔧 — **–20%, e fica melhor.**
O padrão atual é 1080p a 15 fps (2,5 Mbps), que é picotado para jogo. 720p a
30 fps são 2,0 Mbps, mais fluido e mais barato. Quem não liga para fluidez pode
usar `h720fps15` (1,5 Mbps, –40%).

**4. Camada baixa na tela (`screenShareSimulcastLayers`)** 🔧 — **–40% na
prática.** Hoje a tela é publicada em **uma camada só**, então o `dynacast` só
sabe mandar tudo ou parar. Com uma camada de 360p, quem está com a live num
tile pequeno ou em segundo plano passa a receber 0,4 Mbps em vez de 2,5. Numa
sala de 10 onde metade só escuta, é a maior economia isolada.

> `adaptiveStream` e `dynacast` **já estão ligados** ✅
> (`apps/web/src/features/voz/stores/voice-store.ts`). Eles é que aproveitam a camada baixa —
> sem ela, não têm para onde baixar.

**5. Áudio `speech` (24 kbps) em vez de `music` (48 kbps)** 🔧 — **–50% no
áudio**. Como o Krisp já limpa o sinal, fala fica bem. Ressalva: quem tocar um
instrumento ou colocar música soará pior.

### Antes e depois

Cenário: 10 pessoas, 4 h/dia de chamada e 2 h/dia de live, 30 dias.

| | Sem otimizar | Com as cinco alavancas |
|---|---|---|
| Live | ~600 GB → ~US$ 90 | ~230 GB → **~US$ 20** |
| Voz | ~120 GB → ~US$ 18 | ~52 GB → **~US$ 4** |
| Máquina + disco + IP | US$ 45 | US$ 45 |
| **Total** | **~US$ 151/mês** | **~US$ 70/mês** |

> ⚠️ **Alerta de orçamento no Cloud Billing é obrigatório** 👤. No GCP não
> existe teto de egress. Uma live esquecida rodando o fim de semana vira fatura,
> e só se descobre depois. Configurar alertas em 50%, 90% e 100%.

### Se o custo apertar

Provedores com **franquia de tráfego inclusa** cobram o mesmo valor fixo
independentemente do uso. Vultr e AWS Lightsail têm região em São Paulo, com
planos de 2 vCPU / 4 GB por volta de US$ 24/mês e 4 TB inclusos — os ~710 GB
deste cenário caberiam sem otimização nenhuma.

Toda a configuração deste documento vale igual nesses provedores: Docker,
Caddy, portas, Mongo, LiveKit e R2 não mudam. Só mudam esta seção e a seção 3.

> Os valores acima são aproximados e mudam com o tempo. **Confirmar na
> calculadora do provedor antes de fechar orçamento.**

---

## 9. Configuração que muda de dev para produção

### `livekit.yaml` 🔧

```yaml
rtc:
  use_external_ip: true      # hoje está false
  node_ip: <IP ESTÁTICO>     # hoje está 127.0.0.1, que só serve em dev
keys:
  <chave nova>: <segredo novo, mínimo 32 caracteres>
```

> ⚠️ A chave de desenvolvimento (`devkey`/`devsecret-...`) está versionada no
> repositório. **Tem que ser trocada.** Quem tem essa chave entra em qualquer
> chamada.

### Variáveis de ambiente

> ⚠️ **`NODE_ENV=production` é obrigatório, e não é detalhe de performance.**
> Existe uma rota `POST /auth/dev-login` que cria conta e emite sessão **sem
> senha nenhuma** — ela é a porta de entrada dos 16 scripts de verificação
> automatizada. O registro dela é condicionado a
> `NODE_ENV === "development"` (`apps/api/src/routes/auth.ts`), então em
> produção ela simplesmente não existe. Mas se a variável ficar em
> `development` na VM por descuido, **qualquer pessoa entra como qualquer um**.
> O `.env.example` vem com `development` — conferir antes de subir.

Segredos **novos**, não reaproveitados de desenvolvimento 🔧:

- `JWT_SECRET`, `COOKIE_SECRET`
- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` — os mesmos do `livekit.yaml`

Apontando para os domínios 🔧:

| Variável | Onde | Valor |
|---|---|---|
| `WEB_ORIGIN` | VM | `https://chat.<dominio>` |
| `API_PUBLIC_URL` | VM | `https://api.<dominio>` |
| `LIVEKIT_URL` | VM | `wss://sfu.<dominio>` |
| `VITE_API_URL` | Vercel | `https://api.<dominio>` |
| `VITE_WS_URL` | Vercel | `https://api.<dominio>` |
| `GRAVAE_APP_URL` | build do desktop | `https://chat.<dominio>` |

Reaproveitados de desenvolvimento, mesmos valores ✅: `R2_*`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `KLIPY_API_KEY`.

> Os valores reais **não estão neste documento** de propósito. Vão por canal
> separado.

### Google OAuth 👤

No Google Cloud Console → APIs & Services → Credentials, acrescentar às URIs de
redirecionamento autorizadas:

```
https://api.<dominio>/api/auth/google/callback
```

> ⚠️ É o endereço da **API**, não o do front. Com o do front dá
> `redirect_uri_mismatch`. Sem barra no final.

A tela de consentimento está em modo **"Testing"**: só e-mails cadastrados como
*usuários de teste* conseguem entrar (limite de 100). Ou cadastra todo mundo, ou
publica a tela.

### Aplicativo de desktop 🔧

O `empacotar` é `tsup && electron-builder`, **sem `dotenv`** — enquanto o `dev`
usa `dotenv-cli`. Como `apps/desktop/src/main/config.ts` lê `process.env` em
tempo de execução e um app aberto pelo Finder não tem `.env`, **o app instalado
sempre cai em `http://localhost:5173`**. A URL precisa ser embutida no build
antes de gerar instalador para alguém.

---

## 10. Checklist de provisionamento

**Contas e painéis** 👤

- [ ] Projeto no GCP com faturamento ativo
- [ ] **Alerta de orçamento** configurado no Cloud Billing
- [ ] Domínio com DNS na Cloudflare
- [ ] Projeto na Vercel apontado para `apps/web`, com **domínio próprio**
      (`chat.<dominio>`) — nunca `*.vercel.app`
- [ ] URI de redirecionamento do Google acrescentada
- [ ] Política de CORS colada no painel do R2

**Infraestrutura** 🔧

- [ ] VM `e2-medium`, Ubuntu 24.04, disco 50 GB, `southamerica-east1`,
      **Network Tier Standard**
- [ ] IP externo **estático** reservado e anexado
- [ ] Regras de firewall — **conferir a 7882/UDP**
- [ ] `sfu.` e `rtmp.` em **cinza (DNS only)** na Cloudflare
- [ ] Docker + Compose instalados
- [ ] `docker-compose.prod.yml` escrito (sem MinIO, sem portas publicadas)
- [ ] Caddy com os dois roteamentos (`api.` e `sfu.`)
- [ ] Mongo como replica set (ou Atlas M0) com volume persistente
- [ ] Redis com volume persistente, **não** exposto no firewall
- [ ] **`NODE_ENV=production`** — sem isso o `dev-login` sem senha fica exposto
- [ ] Segredos novos gerados (JWT, cookie, LiveKit)
- [ ] `livekit.yaml` com `use_external_ip: true` e `node_ip` = IP estático

**Código** 🔧

- [ ] `vercel.json` com rewrite de SPA
- [ ] `publishDefaults` no `voice-store.ts`: codec, preset de tela, camada
      baixa, preset de áudio
- [ ] `GRAVAE_APP_URL` embutido no build do desktop
- [ ] `R2_DIRECT_UPLOAD=true` depois do CORS

---

## 11. Armadilhas já conhecidas

Cada uma destas já custou tempo:

1. **Chamada conecta e fica muda.** É a 7882/UDP fechada no firewall, ou o
   subdomínio do SFU laranja na Cloudflare, ou `node_ip` errado no
   `livekit.yaml`. Nunca é o código. Nada aparece no log da API.
2. **Sessão morre no reload depois de separar front e API.** É o
   `SameSite=Lax` com o front fora do domínio registrável — ver seção 1.
3. **Login sem senha aberto em produção.** `NODE_ENV` esquecido em
   `development` deixa o `POST /auth/dev-login` no ar — ele cria conta e emite
   sessão para qualquer nome.
4. **`prisma db push` falha com "Transactions are not supported".** Mongo sem
   replica set.
5. **`redirect_uri_mismatch` no login com Google.** A URI cadastrada aponta para
   o front em vez da API.
6. **Variável `VITE_*` mudada no servidor não faz efeito.** Ela é embutida no
   bundle durante o build. Tem que estar na Vercel antes do deploy.
7. **Variável vazia no `.env` não é variável ausente.** `VARIAVEL=` chega como
   string vazia e o `?? padrão` não pega — dá para quebrar o boot com isso.
8. **Egress silencioso.** Com `R2_DIRECT_UPLOAD=false`, todo anexo passa pela
   VM duas vezes (sobe para a API, a API sobe para o R2).
