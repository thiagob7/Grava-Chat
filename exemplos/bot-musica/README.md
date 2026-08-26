# Bot de música do Gravaê

Toca música do YouTube num canal de voz. Roda **fora do app**, como todo bot
daqui: conecta ao gateway pelo token e publica o áudio no SFU.

## Antes

```bash
brew install yt-dlp ffmpeg     # o yt-dlp precisa estar ATUAL, veja abaixo
npm install
```

## Como põe pra tocar

1. No app: **Configurações → Bots** → crie um e copie o token. Copie também o
   **link de convite** e abra: é ali que o bot entra num servidor. Marque
   `Conectar` e `Falar` nas permissões que ele pede, senão ele não consegue
   entrar no canal de voz.
2. Aqui:

   ```bash
   GRAVAE_BOT_TOKEN=cole-o-token node bot.mjs
   ```

3. **Entre num canal de voz** e escreva `!play <música>` em qualquer canal de
   texto. O bot procura você na voz e entra no seu canal.

| comando | o que faz |
|---|---|
| `!play <busca ou link>` | toca, ou põe na fila se já tem algo tocando |
| `!skip` | pula a atual |
| `!stop` | para tudo e sai do canal |
| `!fila` | mostra o que vem por aí |

## Um de cada vez

Rodar `node bot.mjs` duas vezes não dá erro: os dois entram com o mesmo token,
os dois leem a mesma mensagem, e o bot passa a responder em dobro — sem que
nada no console explique por quê. Custou tempo duas vezes até virar uma trava.

Agora a segunda cópia recusa a subir e diz o PID da primeira:

```
Já tem um "bot-musica" no ar (PID 41288).
Dois ao mesmo tempo fazem o bot responder duas vezes a cada comando.
Para derrubar o antigo:  kill 41288
```

## Mantenha o yt-dlp atualizado

É o item que mais quebra, e quebra **calado**: o YouTube muda a proteção, o
yt-dlp antigo passa a levar `403 Forbidden`, e do lado de cá a música parece
"acabar" no mesmo segundo em que começa.

```bash
brew upgrade yt-dlp
```

O bot agora ajuda de duas formas. Na partida ele imprime a versão do yt-dlp e
avisa se ela já passou de dois meses. E quando uma música não toca, ele lê o
erro e responde **no canal** com o próximo passo, em vez do genérico:

> Não consegui tocar **Tim Maia - Azul da Cor do Mar**. O YouTube mudou a
> proteção e o yt-dlp daqui ficou para trás. Atualize com `brew upgrade yt-dlp`.

O que ele não reconhecer continua caindo no terminal, que é onde sai o erro
cru do `yt-dlp` e do `ffmpeg`.

## Sobrevivendo ao reboot

`node bot.mjs` num terminal morre junto com o terminal — e com a queda de
energia. Para o bot e o painel voltarem sozinhos no login do Mac, veja
[`../launchd/`](../launchd/README.md).

## Os comandos

Os quatro existem de duas formas, e o corpo é o mesmo — só muda por onde
chegam.

| | como se usa |
|---|---|
| **barra** | `/play`, `/skip`, `/stop`, `/fila` na lista que o app abre no `/` |
| **texto** | `!play`, `!skip`, `!stop`, `!fila`, com o prefixo que o painel definir |

Pela barra, o bot não fatia string nenhuma: `opcoes.busca` chega separado e já
validado contra o que ele mesmo declarou na partida. Pelo texto, continua tudo
como era — quem já tinha o hábito de escrever `!play` não perdeu nada.

## Ouvir pelo socket, agir por HTTP

O bot continua conectado ao gateway — é de lá que chegam as mensagens, as
entradas no canal de voz e o `member:joined`. Mas **falar é um `POST`**:

```js
const falar = (channelId, content) =>
  pedirHttp(`/bot/canais/${channelId}/mensagens`, { metodo: "POST", corpo: { content } });
```

É a divisão que o Discord faz. O ganho prático apareceu no primeiro erro: um
`emit` que falha some, um `POST` que falha devolve um status e aparece no log.

## Como o som chega no canal

```
yt-dlp  ──►  ffmpeg  ──►  quadros de 20 ms  ──►  LiveKit  ──►  todo mundo
(baixa)     (PCM 48k)      (no relógio)          (o SFU)
```

Duas decisões que valem saber, porque as duas custaram uma sessão de depuração:

**O yt-dlp entrega os bytes, o ffmpeg só converte.** Pedir só a URL
(`yt-dlp -g`) e mandar o ffmpeg baixar dá `403`: o YouTube só honra aquela URL
com os mesmos cabeçalhos que o yt-dlp usou. Por isso os dois vivem ligados por
um cano.

**O ritmo é de um relógio nosso, não do ffmpeg.** Ele converte muito mais
rápido que o tempo real — sem segurar o passo em quadros de 20 ms, a música
inteira ia embora em poucos segundos.
