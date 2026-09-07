import { ehDetectavel } from "@gravae/shared";

/// Os dois selos de comunidade, do jeito que todo retorno de servidor os leva.
export function selosDoServidor(
  guild: { descobrivel: boolean | null; verificada: boolean | null },
  membros: number,
) {
  return {
    verificada: Boolean(guild.verificada),
    detectavel: ehDetectavel(guild.descobrivel, membros),
  };
}
