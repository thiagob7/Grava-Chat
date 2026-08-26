# Gravaê Music — a plataforma

O site do bot, no estilo da Loritta: uma **capa** que apresenta e um **painel**
onde o dono de cada servidor configura o comportamento.

**Isto roda fora do Gravaê.** É o dev que hospeda, e é aqui que ele inventa o
que o bot faz — "prefixo", "fila máxima", "boas-vindas do bot" são invenções
deste site. A plataforma não sabe que existem; ela só entrega o OAuth2 e a API.

```
capa  →  entrar (OAuth2 do Gravaê)  →  escolher servidor  →  configurar
                                                                  ↓
                                          o bot lê /api/config/<servidor>
                                                                  ↓
                                                            obedece
```

## Rodando

1. No app: **Configurações → Bots → seu bot → OAuth2**.
   Ponha `http://localhost:8080/callback` em *Endereços de retorno* e copie o
   **Client ID** e o **Client Secret**. Na aba **Geral**, copie o token.

2. ```bash
   GRAVAE_CLIENT_ID=... \
   GRAVAE_CLIENT_SECRET=... \
   GRAVAE_BOT_TOKEN=... \
   node servidor.mjs
   ```

   O token do bot é opcional: sem ele o painel abre, mas as listas de canais
   ficam vazias — quem enxerga canais é o bot, não o usuário.

3. Suba o bot em `../bot-musica` e mande `!play` no servidor.

## Como a configuração vira comportamento

O painel guarda em `configuracoes.json` e expõe em
`GET /api/config/<guildId>`. O bot consulta essa rota **antes de cada
comando**, com um cache de 15 segundos: curto porque quem mexe no painel espera
efeito em segundos, e não no próximo reinício; existente porque sem ele seria
uma ida à rede por mensagem lida — e o bot lê todas.

Painel fora do ar não derruba o bot: ele cai no padrão e segue respondendo.

## O que a plataforma (o Gravaê) entrega

| | |
|---|---|
| `/oauth2/autorizar` | a tela de "quer acessar sua conta" |
| `POST /api/oauth2/token` | troca o código por token, no seu servidor |
| `GET /api/oauth2/usuario` | quem entrou |
| `GET /api/oauth2/servidores` | onde ela está, **onde ela manda**, e se o bot já está lá |
| `GET /api/bot/servidores/<id>/canais` | os canais, com o token do bot |

## Decisões que valem saber

- **`gerencia`** é o que separa "servidor que aparece para configurar" de
  "servidor onde a pessoa só conversa". O painel só mostra os primeiros.
- **`state`** sorteado a cada login e conferido na volta — sem ele, alguém
  induz a vítima a completar um login que não é dela.
- **A troca do código roda no servidor**, com o segredo. Nunca no navegador: o
  código viaja na barra de endereços.
- **Um `checkbox` desmarcado não é enviado.** Por isso cada um leva um campo
  escondido dizendo "existo nesta aba" — sem isso, salvar a aba Música
  desligaria as boas-vindas configuradas na outra.
- **O painel não abre WebSocket nenhum.** Lê pela API do bot (`GET
  /bot/servidores/:id/canais`) e escreve pela API do bot (`POST
  /bot/canais/:id/mensagens`). É o que o "Salvar e testar" das boas-vindas
  usa: manda a mensagem de verdade, no canal escolhido, com você no lugar de
  quem entrou.

  O valor dele é descobrir cedo. Bot sem permissão de escrever ali responde
  403 na cara de quem está configurando — e não silêncio no dia em que alguém
  entrar no servidor. Canal de servidor onde o bot não está responde 404.
