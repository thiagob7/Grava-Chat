# Bot e painel sobrevivendo ao reboot

Rodar `node bot.mjs` num terminal funciona até a hora em que o Mac reinicia —
ou a energia cai. Aí some tudo, e da próxima vez você descobre pelo bot que não
responde.

O `launchd` é o que o macOS usa para subir coisas no login. Estes dois scripts
escrevem os `.plist` com os caminhos e segredos **desta** máquina e entregam a
ele.

## Instalar

```bash
cp segredos.env.exemplo segredos.env
$EDITOR segredos.env      # token, client id e client secret
./instalar.sh
```

Os três valores estão no app, em **Configurações → Bots → GRAVAE MUSIC**: o
token na aba *Geral*, o id e o segredo na aba *OAuth2*. O token só aparece uma
vez; se perdeu, gere outro — e o antigo morre na hora.

Rode o `instalar.sh` de novo sempre que mudar o `segredos.env` ou trocar de
versão do node. Ele derruba e recoloca.

## Ver o que está acontecendo

```bash
tail -f ~/Library/Logs/gravae/com.gravae.bot-musica.log
tail -f ~/Library/Logs/gravae/com.gravae.painel.log

launchctl print gui/$UID/com.gravae.bot-musica   # estado, PID, última saída
```

## Parar

```bash
launchctl kickstart -k gui/$UID/com.gravae.bot-musica   # reiniciar agora
launchctl stop gui/$UID/com.gravae.bot-musica           # parar até o próximo login
./desinstalar.sh                                        # tirar de vez
```

## Rodar na mão enquanto mexe no código

Pare o do launchd primeiro. Os dois no ar ao mesmo tempo é exatamente o caso
que a trava de instância única barra — o segundo recusa a subir, com o PID do
primeiro na mensagem.

```bash
launchctl stop gui/$UID/com.gravae.bot-musica
cd ../bot-musica && GRAVAE_BOT_TOKEN=<token> node bot.mjs
```

Como o `KeepAlive` está ligado, o launchd traz o dele de volta em até 30
segundos depois de um `stop`. Enquanto estiver com a mão no código, prefira o
`./desinstalar.sh`.

## O que dói aqui

- **O launchd não abre o seu shell.** Sem `.zshrc`, sem `nvm`, e o `PATH`
  quase vazio. Um `node` que só existe no `nvm` e o `yt-dlp` do Homebrew não
  seriam encontrados. Por isso o `instalar.sh` resolve os caminhos na hora da
  instalação e escreve dentro do plist — e por isso ele precisa rodar de novo
  quando você troca a versão do node.
- **`bootstrap` recusa um rótulo que já existe.** Daí o `bootout` antes.
- **Login é antes do Docker.** No primeiro minuto a API ainda não responde. O
  bot fica tentando reconectar sozinho, então não é problema — só não estranhe
  o `connect_error` no começo do log.
- **Segredo no plist é texto puro** em `~/Library/LaunchAgents`. Para a sua
  máquina, tudo bem; numa VPS, isso vira variável de ambiente do systemd ou um
  gerenciador de segredos de verdade.
