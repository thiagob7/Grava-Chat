import { readFileSync, writeFileSync } from "node:fs";

const ARQUIVO = new URL("./configuracoes.json", import.meta.url);

/**
 * A configuração de cada servidor — o coração da coisa.
 *
 * Isto mora no DEV, não no Gravaê. A plataforma não sabe (nem precisa saber)
 * que este bot tem "prefixo" ou "anúncio de música": foi o dev que inventou,
 * e é o bot dele que lê e obedece.
 *
 * Um JSON em disco basta para o exemplo, e tem a vantagem de sobreviver ao
 * reinício — um Map em memória faria o painel parecer quebrado toda vez que o
 * processo caísse.
 */
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
  /// Sempre devolve algo utilizável: servidor que nunca foi configurado
  /// recebe o padrão, e o bot não precisa tratar "não existe".
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
