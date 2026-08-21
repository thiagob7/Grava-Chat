#!/usr/bin/env python3
"""Teste de fumaca da API: percorre o fluxo inteiro da Fase 2 via HTTP.

Uso: python3 apps/api/scripts/smoke.py
Requer a API rodando (yarn dev) e o dev-login habilitado.
"""
import json
import urllib.request
import urllib.error

BASE = "http://localhost:3333/api"


def call(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{BASE}{path}", data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raise SystemExit(f"FALHOU {method} {path} -> {e.code} {e.read().decode()}")


def login(email, name):
    r = call("POST", "/auth/dev-login", body={"email": email, "displayName": name})
    return r["accessToken"], r["user"]


ok = lambda msg: print(f"  ok  {msg}")

print("\n== auth ==")
t1, u1 = login("thiago@gravae.io", "Thiago")
t2, u2 = login("amigo@gravae.io", "Amigo")
ok(f"{u1['displayName']} (@{u1['username']}) e {u2['displayName']} (@{u2['username']})")

me = call("GET", "/me", t1)
assert me["id"] == u1["id"]
ok("/me devolve o usuario logado")

print("\n== servidor ==")
guild = call("POST", "/guilds", t1, {"name": "GRAVAE"})
gid = guild["id"]
detail = call("GET", f"/guilds/{gid}", t1)
ok(f"criado com categorias {[c['name'] for c in detail['categories']]}")
ok(f"canais padrao {[(c['name'], c['type']) for c in detail['channels']]}")

print("\n== permissao ==")
try:
    call("GET", f"/guilds/{gid}", t2)
    raise SystemExit("FALHOU: nao-membro conseguiu ler o servidor")
except SystemExit as e:
    assert "404" in str(e), e
    ok("nao-membro recebe 404 (nao vaza nem a existencia do servidor)")

print("\n== convite ==")
inv = call("POST", f"/guilds/{gid}/invites", t1, {})
preview = call("GET", f"/invites/{inv['code']}", t2)
ok(f"preview mostra '{preview['guild']['name']}' convidado por {preview['inviter']}")
joined = call("POST", f"/invites/{inv['code']}/join", t2)
assert joined["guildId"] == gid
ok("amigo entrou pelo link")
again = call("POST", f"/invites/{inv['code']}/join", t2)
assert again["alreadyMember"] is True
ok("entrar duas vezes nao duplica o membro")

detail = call("GET", f"/guilds/{gid}", t2)
assert len(detail["members"]) == 2
ok(f"servidor agora tem {len(detail['members'])} membros")

print("\n== canais ==")
new_ch = call("POST", f"/guilds/{gid}/channels", t1, {"name": "pedir-musica", "type": "TEXT"})
ok(f"canal #{new_ch['name']} criado pelo dono")
try:
    call("POST", f"/guilds/{gid}/channels", t2, {"name": "invadido", "type": "TEXT"})
    raise SystemExit("FALHOU: membro comum criou canal")
except SystemExit as e:
    assert "403" in str(e), e
    ok("membro comum recebe 403 ao tentar criar canal")

text_channel = next(c for c in detail["channels"] if c["type"] == "TEXT")
msgs = call("GET", f"/channels/{text_channel['id']}/messages", t1)
ok(f"historico de #{text_channel['name']} responde ({len(msgs['messages'])} mensagens)")

print("\n== upload ==")
pre = call("POST", "/uploads/presign", t1, {"filename": "print.png", "contentType": "image/png", "size": 1024})
assert "X-Amz-Signature" in pre["uploadUrl"]
ok("URL assinada de upload gerada")

# limpa o servidor criado por este teste — senão cada execucao deixa lixo
call("DELETE", f"/guilds/{gid}", t1)
try:
    call("GET", f"/guilds/{gid}", t1)
    raise SystemExit("FALHOU: servidor apagado ainda responde")
except SystemExit as e:
    assert "404" in str(e), e
    ok("dono apaga o servidor e ele some de verdade")

print(f"\nTudo certo.")

