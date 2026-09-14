import { readFileSync, writeFileSync } from "node:fs";

const ARQUIVO = new URL("./configuracoes.json", import.meta.url);

export const PADRAO = {
  prefixo: "!",
  canalDeComandos: "",
  anunciarMusica: true,
  volume: 100,
  filaMaxima: 50,
  boasVindasLigadas: false,
  boasVindasCanal: "",
  boasVindasTexto: "Bem-vindo, {pessoa}! 🎧 Manda um {prefixo}play pra começar.",
};

function ler() {
  try {
    return JSON.parse(readFileSync(ARQUIVO, "utf8"));
  } catch {
    return {};
  }
}

function gravar(tudo) {
  writeFileSync(ARQUIVO, JSON.stringify(tudo, null, 2));
}

export const configuracoes = {
  de(guildId) {
    return { ...PADRAO, ...(ler()[guildId] ?? {}) };
  },

  salvar(guildId, mudancas) {
    const tudo = ler();
    tudo[guildId] = { ...PADRAO, ...(tudo[guildId] ?? {}), ...mudancas };
    gravar(tudo);

    return tudo[guildId];
  },
};
