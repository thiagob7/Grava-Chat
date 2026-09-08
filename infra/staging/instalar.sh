#!/usr/bin/env bash
# Instala a segunda API na mesma VM: a de staging, na porta 3334.
#
# Idempotente. O .env de staging, se ja existir la, NAO e sobrescrito — e
# onde moram os segredos e o banco proprio dele.
set -euo pipefail

HOST="${HOST:-ubuntu@129.148.31.163}"
CHAVE="${CHAVE:-$HOME/oracle-a1/api-key}"
SSH="ssh -i $CHAVE -o BatchMode=yes"
AQUI="$(cd "$(dirname "$0")" && pwd)"
DESTINO="/opt/gravae-api-staging"

[ -f "$CHAVE" ] || { echo "chave nao encontrada: $CHAVE"; exit 1; }

echo "==> enviando arquivos"
$SSH "$HOST" "mkdir -p /tmp/gravae-staging"
scp -q -i "$CHAVE" \
  "$AQUI/gravae-api-staging.service" \
  "$AQUI/Caddyfile" \
  "$HOST:/tmp/gravae-staging/"

echo "==> instalando"
$SSH "$HOST" "sudo bash -s" <<'INSTALA'
set -euo pipefail
cd /tmp/gravae-staging

install -d -o ubuntu -g ubuntu /opt/gravae-api-staging/prisma
install -m 0644 gravae-api-staging.service /etc/systemd/system/

# O Caddyfile e o mesmo arquivo da producao: um erro aqui derruba a API de
# verdade junto. Valida ANTES de encostar no que esta valendo, e guarda o
# anterior para o caso de precisar voltar na mao.
caddy validate --config Caddyfile --adapter caddyfile >/dev/null

if [ -f /etc/caddy/Caddyfile ] && ! cmp -s Caddyfile /etc/caddy/Caddyfile; then
  cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak-$(date +%Y%m%d-%H%M%S)"
fi

install -m 0644 Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy
systemctl daemon-reload

rm -rf /tmp/gravae-staging
INSTALA

echo "==> conferindo o .env de staging"
if $SSH "$HOST" "test -f $DESTINO/.env"; then
  echo "    ja existe — nao mexi"
else
  echo
  echo "  FALTA O .env. Crie $DESTINO/.env na VM a partir do de producao,"
  echo "  trocando ao menos estas linhas:"
  echo
  echo "    API_PORT=3334"
  echo "    DATABASE_URL=...  (MESMO cluster, outro nome de banco: /gravae-staging)"
  echo "    REDIS_URL=redis://localhost:6379/1   (o indice 1, para nao misturar)"
  echo "    JWT_SECRET=...    (outro, senao a sessao de staging vale em producao)"
  echo "    COOKIE_SECRET=... (outro, pelo mesmo motivo)"
  echo "    WEB_ORIGIN=https://<a-url-de-staging-na-vercel>"
  echo "    R2_PREFIX=gravae-chat-staging   (para o arquivo de teste nao se misturar)"
  echo
  echo "  Depois: bash infra/staging/publicar.sh"
  exit 0
fi

echo "==> ligando"
$SSH "$HOST" "sudo systemctl enable --now gravae-api-staging && systemctl is-active gravae-api-staging"
echo "pronto"
