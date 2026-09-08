# Publicar a API pelo GitHub

O deploy sempre saiu da máquina de quem programa, sem aprovação e sem registro.
Em 08/09/2026 isso publicou em produção um commit da `dev`: o script constrói a
partir da branch aberta, e ninguém está olhando às onze da noite.

Agora o `.github/workflows/api.yml` constrói no runner e **para**, esperando um
revisor liberar o ambiente `producao`. Só depois toca na máquina.

## Por que a chave do GitHub não é acesso à VM

O pacote vai por **uma** conexão, para a entrada padrão de um script fixo. No
`authorized_keys` a chave está assim:

```
command="/usr/local/bin/gravae-receber-publicacao",restrict ssh-ed25519 AAAA...
```

`command=` ignora o que o outro lado pediu e roda sempre esse script. `restrict`
tira terminal, encaminhamento de porta e de agente. Quem tiver a chave não lê
arquivo, não abre shell, não escolhe comando — só consegue mandar um pacote e
fazer o serviço reiniciar.

Conferido em 08/09: `ssh -i <chave> ubuntu@vm "cat /etc/passwd"` não lê nada;
cai no script e falha por não receber um pacote válido.

O `sudo` também é de uma linha só, em `/etc/sudoers.d/gravae-publicar`:
reiniciar o `gravae-api`, e nada mais.

## O que precisa existir no repositório

| Onde | Nome | Valor |
|---|---|---|
| Settings → Secrets → Actions | `VM_SSH_KEY` | a chave **privada** de publicação |
| Settings → Variables → Actions | `VM_HOST` | o IP da VM da API |
| Settings → Environments | `producao` | com **required reviewers** |

Sem o ambiente `producao` com revisor, o fluxo publica sozinho — que é
justamente o que se quer evitar.
