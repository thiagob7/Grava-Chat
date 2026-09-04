# Um bot do Gravaê

O bot **não roda dentro do Gravaê**. Ele roda onde você quiser e se conecta de
fora pelo WebSocket, do mesmo jeito que um bot de outro app de chat. A gente entrega o
token e o endereço; a hospedagem é sua.

## Como põe de pé

1. No app: **Configurações → Bots → Criar bot**. Copie o token — ele aparece
   uma vez só. Se perder, gere outro (o antigo morre na hora).
2. Ainda ali, copie o **link de convite** e abra. A tela mostra o que o bot
   pede e deixa escolher o servidor. Quem autoriza precisa de `MANAGE_GUILD`
   ali — se o servidor é de outra pessoa, mande o link pra ela.
3. Na sua máquina:

   ```bash
   npm i socket.io-client
   GRAVAE_BOT_TOKEN=cole-o-token-aqui node bot.mjs
   ```

Se aparecer `no ar.`, ele está conectado. Escreva `!ping` num canal onde o bot
esteja e ele responde.

Rodar o arquivo duas vezes faria o bot responder `pong` duas vezes, sem nada no
console dizendo por quê. Uma trava com o PID em `/tmp` barra a segunda cópia e
mostra qual processo derrubar.

## O que dá pra fazer

O bot é um membro como outro qualquer: ele **obedece aos cargos e permissões**
do servidor. Se ele não tem permissão de escrever num canal, ele não escreve —
ajuste isso em Configurações do servidor → Cargos, como faria com uma pessoa.

Eventos que chegam (os mesmos do app): `message:created`, `message:updated`,
`message:deleted`, `message:reactions`, `presence:changed`, e os de voz.

Coisas que ele pode mandar pelo socket: `message:send`, `message:edit`,
`message:delete`, `message:react`, `typing:start`.

**As mesmas ações existem por HTTP**, e é o caminho que vale a pena preferir:
o gateway serve para saber o que ACONTECEU, e um `POST` devolve o que foi
criado, com id e com o status de quando dá errado. Pelo socket, mandar é um
`emit` no escuro.

```
POST   /api/bot/canais/:channelId/mensagens        { content, attachments?, poll?, ... }
PATCH  /api/bot/mensagens/:messageId               { content }
DELETE /api/bot/mensagens/:messageId
PUT    /api/bot/mensagens/:messageId/reacoes/:emoji  { burst? }
DELETE /api/bot/mensagens/:messageId/reacoes/:emoji
```

Todas com `Authorization: Bot <token>`. O emoji vai percent-encoded no caminho
(`%F0%9F%94%A5` para 🔥, `%3Afogo%3A` para o custom `:fogo:`).

As permissões são as mesmas de sempre: um bot é um membro, e escrever num canal
onde ele não pode escrever falha igual falharia para uma pessoa. Canal de
servidor onde ele não está responde **404** — do ponto de vista dele, aquele
canal não existe.

## Comandos de barra

Ler texto e procurar um prefixo funciona, mas quem usa precisa descobrir os
comandos em algum README, e o bot precisa fatiar a string na mão. A alternativa
é declarar o que ele sabe fazer:

```
PUT /api/bot/comandos     { comandos: [ ... ] }
```

```js
await fetch(`${SERVIDOR}/api/bot/comandos`, {
  method: "PUT",
  headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    comandos: [
      {
        nome: "play",
        descricao: "Toca uma música",
        opcoes: [
          { nome: "busca", descricao: "Nome ou link", tipo: "texto", obrigatoria: true },
        ],
      },
    ],
  }),
});
```

A lista inteira de uma vez, substituindo a anterior — apagar um comando é
deixar de mandá-lo, e o bot não precisa lembrar o que registrou da última vez.

Aí o app desenha a lista quando alguém digita `/`, e o comando chega pronto:

```js
socket.on("command:invoked", ({ channelId, comando, opcoes, usuario, messageId }) => {
  // opcoes.busca já veio separado, e já é do tipo declarado
});
```

Os tipos de opção são `texto`, `numero`, `usuario` e `canal`. O servidor
converte antes de entregar: `numero` chega número, `usuario` e `canal` chegam
como id. **Nada disso precisa ser validado de novo no bot** — se faltou uma
opção obrigatória ou o número não era número, o evento nem chega.

Duas regras que o registro cobra na hora:

- **Nomes únicos**, entre comandos e entre opções do mesmo comando.
- **Opção obrigatória não vem depois de opcional.** Quem digita escreve os
  valores em ordem, sem nome; com `/lembrete [hora] <texto>`, uma linha só não
  diria qual pedaço é de qual.

`messageId` é a linha "fulano usou /play" que fica no canal — dá para citá-la
na resposta.

## Cuidado com o token

Quem tem o token **é** o bot: escreve como ele, em todo servidor onde ele está.
Trate como senha. Não suba para o GitHub — use variável de ambiente, como no
exemplo. Vazou? Gere outro na tela de Bots.
