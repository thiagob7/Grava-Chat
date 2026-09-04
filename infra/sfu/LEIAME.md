# Agente de métricas da VM do SFU

Faz o painel de servidor do app mostrar **as duas** máquinas de produção em vez
de uma.

## Por que existe

O bloco de CPU/Memória/Disco do painel é a API se auto-medindo: `os.loadavg()` e
`/proc/meminfo` só sabem da caixa onde o processo está. A VM do LiveKit é outra
caixa e não tem processo nosso, então o painel só sabia dela o que o
`listRooms()` responde — um teste de alcance, que dá "no ar" mesmo com o disco
cheio e a RAM no talo.

## Por que passa pelo Caddy, e não por uma porta própria

Testado em 04/09/2026: as duas VMs estão na mesma VCN e sub-rede (`10.0.0.0/24`,
ARP resolvendo direto), mas a **security list da Oracle só deixa passar as portas
já publicadas** — 22, 80, 443, 7881, 7882. Uma porta nova, mesmo restrita à
sub-rede, exige regra no console.

A 443 já está aberta e já tem TLS pelo Caddy. Então o agente escuta em
`127.0.0.1:9101` — inalcançável de fora, inclusive da sub-rede — e o Caddy expõe
`/interno/maquina` filtrando por IP de origem. Resultado: nenhuma porta nova,
nenhuma mudança no console, e o endereço responde a quem não é a API
exatamente como qualquer caminho inexistente (o pedido não casa o matcher, cai no
LiveKit e vira 404).

## Por que não é um serviço parado

`Accept=yes` no socket: o systemd escuta, e o script nasce a cada conexão,
responde e morre. A VM tem 954 MB e o LiveKit é o inquilino que importa — deixar
um processo parado gastando dezenas de MB pra responder de 5 em 5 segundos
custaria mais do que entrega.

## Instalar

```sh
./infra/sfu/instalar.sh
```

Idempotente: reaproveita o token que já estiver na VM. No fim ele imprime as duas
linhas pro `.env` da API — depois delas, `~/oracle-a1/deploy-api.sh`.

## Ver de perto

```sh
# na VM do SFU
sudo systemctl status gravae-maquina.socket
journalctl -u 'gravae-maquina@*' -n 30       # erros do script saem aqui
curl -H "Authorization: Bearer $(sudo sed -n 's/^GRAVAE_MAQUINA_TOKEN=//p' /etc/gravae/maquina.env)" \
  http://127.0.0.1:9101/interno/maquina
```

O Caddyfile anterior fica salvo como `/etc/caddy/Caddyfile.bak-<data>`.
