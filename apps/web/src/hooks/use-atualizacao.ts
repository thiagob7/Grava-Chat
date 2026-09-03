import { useEffect, useState } from "react";
import type { EstadoDaAtualizacao } from "@gravae/shared";

import { desktop } from "~/lib/desktop";

/**
 * O estado da atualização do aplicativo, para quem quiser mostrar.
 *
 * Estava dentro da faixa de aviso, e por isso só existia lá. O trilho de
 * servidores também precisa: é onde o botão de atualizar mora quando a faixa
 * já foi dispensada — ou quando a pessoa fechou e quer voltar a ela.
 *
 * `atualizacao` pode não existir: quem está com um aplicativo anterior à
 * v0.2.0 tem uma ponte sem ela. Sem esta guarda, o site novo quebraria
 * justamente no app velho — que é exatamente quem precisa atualizar.
 */
export function useAtualizacao() {
  const [estado, setEstado] = useState<EstadoDaAtualizacao | null>(null);

  useEffect(() => {
    const ponte = desktop()?.atualizacao;
    if (!ponte) return;

    void ponte.estado().then(setEstado);
    return ponte.aoMudar(setEstado);
  }, []);

  const ponte = desktop()?.atualizacao;

  return {
    estado,
    ponte,
    /// Erro de rede não conta como novidade: tenta de novo sozinho daqui a
    /// pouco, e um botão vermelho por causa de Wi-Fi oscilando é só barulho.
    temNovidade: Boolean(estado?.disponivel) && estado?.fase !== "erro",
    baixando: estado?.fase === "baixando",
    pronta: estado?.fase === "pronta",
    /// Os segundos entre o clique e o app fechar. Curto quando dá certo, e é
    /// justamente por ser curto que ele precisa aparecer: sem isso o clique
    /// não tinha resposta nenhuma.
    instalando: estado?.fase === "instalando",
  };
}
