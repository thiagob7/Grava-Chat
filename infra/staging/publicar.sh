#!/usr/bin/env bash
# Publica a branch atual na API de staging. Mesmo caminho do deploy-api.sh de
# producao, mudando so o destino e o servico.
set -euo pipefail

REPO="${REPO:-$HOME/Documents/gravae-chat}"
HOST="${HOST:-ubuntu@129.148.31.163}"
CHAVE="${CHAVE:-$HOME/oracle-a1/api-key}"
DESTINO="/opt/gravae-api-staging"
SSH="ssh -i $CHAVE -o BatchMode=yes"

cd "$REPO"
echo "==> build ($(git branch --show-current))"
yarn workspace @gravae/api build >/dev/null

echo "==> package.json enxuto"
node -e '
const p = require("./apps/api/package.json");
delete p.dependencies["@gravae/shared"];
p.devDependencies = { prisma: p.devDependencies.prisma };
p.scripts = { start: "node dist/server.js" };
require("fs").writeFileSync("/tmp/api-staging-package.json", JSON.stringify(p, null, 2));
'

echo "==> enviando"
$SSH "$HOST" "sudo mkdir -p $DESTINO/prisma && sudo chown -R ubuntu:ubuntu $DESTINO"
rsync -az --delete -e "$SSH" apps/api/dist/ "$HOST:$DESTINO/dist/"
rsync -az -e "$SSH" apps/api/prisma/schema.prisma "$HOST:$DESTINO/prisma/"
rsync -az -e "$SSH" /tmp/api-staging-package.json "$HOST:$DESTINO/package.json"

echo "==> dependencias e Prisma Client"
$SSH "$HOST" "cd $DESTINO && npm install --omit=dev --no-audit --no-fund --silent && npx prisma generate --schema prisma/schema.prisma"

echo "==> reiniciando"
$SSH "$HOST" "sudo systemctl restart gravae-api-staging"
$SSH "$HOST" "systemctl is-active gravae-api-staging"
echo "pronto"
