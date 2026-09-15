# Bots interativos

Quatro bots pequenos que usam as peças interativas da API: cartões (`embeds`),
botões, menus, formulários e respostas que só quem clicou vê. Eles servem de
molde: nenhum usa rota feita só pra ele.

| Arquivo | O que faz | Peças |
|---|---|---|
| `tickets-bot.mjs` | Painel com menu de categorias → canal privado com a pessoa e a equipe → Aceitar e Concluir | cartão, menu, botão, permissão por pessoa, `update`, resposta privada |
| `reports-bot.mjs` | `/report` → formulário → cartão no canal da moderação com Resolvida e Arquivar | formulário, cartão, botão, resposta privada |
| `role-picker-bot.mjs` | Painel com menu de várias escolhas que dá e tira cargos | menu múltiplo, cargos, resposta privada |
| `tic-tac-toe-bot.mjs` | `/tic-tac-toe @alguém` → tabuleiro de botões editado a cada jogada | botão, `update`, resposta privada |

`bot-kit.mjs` é o que eles têm em comum: conecta pelo socket, chama a API com o
token e responde às interações.

## Como põe de pé

1. No app: **Configurações → Bots → Criar bot**, copie o token e convide o bot
   pro servidor.
2. Nesta pasta:

   ```bash
   npm i
   GRAVAE_BOT_TOKEN=cole-o-token GRAVAE_URL=https://sua-api node tickets-bot.mjs
   ```

Cada bot pede as variáveis dele e avisa se faltar:

| Bot | Variáveis |
|---|---|
| tickets | `TICKETS_STAFF_ROLE_ID` (cargo da equipe), `TICKETS_CATEGORY_ID` (opcional) |
| reports | `REPORTS_CHANNEL_ID` (canal da moderação), `REPORTS_MOD_ROLE_ID` (cargo da moderação) |
| role-picker | `ROLE_PICKER_ROLES`, no formato `Minecraft:<id>,Roblox:<id>` |
| tic-tac-toe | nenhuma |

## Permissões que o bot precisa

O bot é um membro como outro qualquer.

- **tickets:** `MANAGE_CHANNELS` pra criar o canal e `MANAGE_ROLES` pra dar
  acesso a quem abriu. O cargo do bot precisa estar **acima** de quem abre
  atendimento, e ele só concede o que ele mesmo tem.
- **role-picker:** `MANAGE_ROLES`, com o cargo do bot acima dos cargos do painel.
- **reports e tic-tac-toe:** escrever nos canais onde vão falar.

## Como uma interação funciona

1. Alguém clica num botão, escolhe num menu ou envia um formulário.
2. O bot recebe `interaction:created` com `id`, `token`, `customId`, `values`
   (menu), `fields` (formulário), `user` e `member.roleIds`.
3. O bot responde **uma vez, em até 3 segundos**:

```
POST /api/bot/interactions/:id/:token/callback
{ "type": "reply",  "data": { "content": "…", "ephemeral": true } }
{ "type": "update", "data": { "content": "…", "components": [ … ] } }
{ "type": "defer" }
{ "type": "modal",  "data": { "customId": "…", "title": "…", "fields": [ … ] } }
```

Se o trabalho for demorar, mande `defer` e depois use as rotas normais de
mensagem. Comandos de barra (`command:invoked`) chegam com `id` e `token`
também, então dá pra responder a eles do mesmo jeito, só não com `update`.

Os jogos e as denúncias ficam na memória do processo: reiniciar o bot esquece
o que estava aberto. Pra valer de verdade, guarde num banco.
