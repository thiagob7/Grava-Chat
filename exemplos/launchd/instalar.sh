#!/bin/bash
#
# Bot e painel subindo sozinhos no login do Mac.
#
# Gera os dois .plist com os caminhos e segredos desta máquina e entrega ao
# launchd. Rode de novo sempre que mudar `segredos.env` — ele derruba e
# recoloca.
#
#   ./instalar.sh
#
set -euo pipefail

AQUI="$(cd "$(dirname "$0")" && pwd)"
EXEMPLOS="$(dirname "$AQUI")"
AGENTES="$HOME/Library/LaunchAgents"
LOGS="$HOME/Library/Logs/gravae"

if [ ! -f "$AQUI/segredos.env" ]; then
  echo "Falta o segredos.env. Comece por:"
  echo "  cp $AQUI/segredos.env.exemplo $AQUI/segredos.env"
  exit 1
fi

# Ler o arquivo linha a linha em vez de dar `source`.
#
# O `source` manda o conteúdo para o shell interpretar, e aí um token com `&`,
# `<`, `$` ou espaço vira comando: a instalação morre com um erro que não tem
# nada a ver com o que está acontecendo. Aqui o valor é copiado como está.
while IFS= read -r linha || [ -n "$linha" ]; do
  linha="${linha%$'\r'}"
  case "$linha" in
    ''|'#'*) continue ;;
    *=*) ;;
    *) continue ;;
  esac

  chave="${linha%%=*}"
  valor="${linha#*=}"

  case "$chave" in
    [A-Za-z_]*) ;;
    *) continue ;;
  esac

  # Aspas em volta são da escrita do arquivo, não do segredo.
  case "$valor" in
    \"*\") valor="${valor#\"}"; valor="${valor%\"}" ;;
    "'"*"'") valor="${valor#\'}"; valor="${valor%\'}" ;;
  esac

  printf -v "$chave" '%s' "$valor"
done < "$AQUI/segredos.env"

for obrigatorio in GRAVAE_BOT_TOKEN GRAVAE_CLIENT_ID GRAVAE_CLIENT_SECRET; do
  if [ -z "${!obrigatorio:-}" ]; then
    echo "$obrigatorio está vazio no segredos.env."
    exit 1
  fi
done

# O launchd não abre o seu shell: não existe .zshrc, não existe nvm, e o PATH
# começa praticamente vazio. Tudo que o bot chama precisa ir por caminho
# absoluto — o `node` de agora, e o /opt/homebrew/bin onde moram o yt-dlp e o
# ffmpeg. Por isso o valor é resolvido aqui, na instalação, e escrito dentro
# do plist.
NODE="$(command -v node)"
CAMINHO="$(dirname "$NODE"):/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$AGENTES" "$LOGS"

# `&` `<` `>` no meio de um segredo quebrariam o XML calado — o plist vira
# inválido e o launchd recusa sem dizer por quê.
escapar() {
  printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'
}

plist() {
  local rotulo="$1" diretorio="$2" script="$3"
  shift 3

  {
    echo '<?xml version="1.0" encoding="UTF-8"?>'
    echo '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
    echo '<plist version="1.0">'
    echo '<dict>'
    echo "  <key>Label</key><string>$rotulo</string>"
    echo '  <key>ProgramArguments</key>'
    echo "  <array><string>$(escapar "$NODE")</string><string>$(escapar "$script")</string></array>"
    echo "  <key>WorkingDirectory</key><string>$(escapar "$diretorio")</string>"
    echo '  <key>RunAtLoad</key><true/>'
    echo '  <key>KeepAlive</key><true/>'
    # Sem a espera, um erro logo na partida vira um laço: morre, sobe, morre,
    # sobe, e o log enche em segundos.
    echo '  <key>ThrottleInterval</key><integer>30</integer>'
    echo "  <key>StandardOutPath</key><string>$(escapar "$LOGS/$rotulo.log")</string>"
    echo "  <key>StandardErrorPath</key><string>$(escapar "$LOGS/$rotulo.log")</string>"
    echo '  <key>EnvironmentVariables</key>'
    echo '  <dict>'
    echo "    <key>PATH</key><string>$(escapar "$CAMINHO")</string>"
    for par in "$@"; do
      echo "    <key>${par%%=*}</key><string>$(escapar "${par#*=}")</string>"
    done
    echo '  </dict>'
    echo '</dict>'
    echo '</plist>'
  }
}

instalar() {
  local rotulo="$1"
  shift

  local destino="$AGENTES/$rotulo.plist"
  plist "$rotulo" "$@" > "$destino"

  # `bootout` antes de `bootstrap` porque o launchd recusa carregar um rótulo
  # que já conhece. Falha na primeira vez, quando não há o que derrubar — daí
  # o `|| true`.
  launchctl bootout "gui/$UID/$rotulo" 2>/dev/null || true
  launchctl bootstrap "gui/$UID" "$destino"

  echo "  $rotulo  →  $LOGS/$rotulo.log"
}

echo "Instalando com node em $NODE"

instalar com.gravae.bot-musica \
  "$EXEMPLOS/bot-musica" "$EXEMPLOS/bot-musica/bot.mjs" \
  "GRAVAE_BOT_TOKEN=$GRAVAE_BOT_TOKEN" \
  "GRAVAE_URL=${GRAVAE_URL:-http://localhost:3333}" \
  "GRAVAE_PAINEL=http://localhost:8080"

instalar com.gravae.painel \
  "$EXEMPLOS/painel" "$EXEMPLOS/painel/servidor.mjs" \
  "GRAVAE_BOT_TOKEN=$GRAVAE_BOT_TOKEN" \
  "GRAVAE_CLIENT_ID=$GRAVAE_CLIENT_ID" \
  "GRAVAE_CLIENT_SECRET=$GRAVAE_CLIENT_SECRET" \
  "GRAVAE_API=${GRAVAE_URL:-http://localhost:3333}/api" \
  "GRAVAE_APP=${GRAVAE_APP:-http://localhost:5173}"

echo
echo "No ar, e voltam sozinhos no próximo login."
echo "Painel: http://localhost:8080"
