#!/usr/bin/env bash
# Recebe UMA publicacao pela entrada padrao e reinicia a API.
#
# Este script e o `command=` da chave de publicacao no authorized_keys: quem
# tem a chave nao ganha terminal, nao escolhe comando, nao le arquivo. So
# consegue mandar um pacote e fazer o servico reiniciar — que e exatamente o
# que o GitHub precisa, e nada alem.
set -euo pipefail

DESTINO="${DESTINO:-/opt/gravae-api}"
SERVICO="${SERVICO:-gravae-api}"

TEMP="$(mktemp -d)"
trap 'rm -rf "$TEMP"' EXIT

# O pacote vem pelo stdin. Limite de tamanho para uma entrada estranha nao
# encher o disco da VM.
head -c 200000000 > "$TEMP/pacote.tgz"
tar xzf "$TEMP/pacote.tgz" -C "$TEMP"

[ -f "$TEMP/dist/server.js" ] || { echo "pacote sem dist/server.js"; exit 1; }
[ -f "$TEMP/package.json" ] || { echo "pacote sem package.json"; exit 1; }

rsync -a --delete "$TEMP/dist/" "$DESTINO/dist/"
install -m 0644 "$TEMP/package.json" "$DESTINO/package.json"
install -d "$DESTINO/prisma"
install -m 0644 "$TEMP/prisma/schema.prisma" "$DESTINO/prisma/schema.prisma"

cd "$DESTINO"
npm install --omit=dev --no-audit --no-fund --silent
npx prisma generate --schema prisma/schema.prisma >/dev/null

sudo systemctl restart "$SERVICO"
systemctl is-active "$SERVICO"
