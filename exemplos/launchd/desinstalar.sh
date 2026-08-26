#!/bin/bash
#
# Tira bot e painel do login. Os logs ficam.
#
set -euo pipefail

for rotulo in com.gravae.bot-musica com.gravae.painel; do
  launchctl bootout "gui/$UID/$rotulo" 2>/dev/null || true
  rm -f "$HOME/Library/LaunchAgents/$rotulo.plist"
  echo "  $rotulo fora."
done
