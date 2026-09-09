import { ehDetectavel } from "@gravae/shared";

export function selosDoServidor(
  guild: { descobrivel: boolean | null; verificada: boolean | null },
  membros: number,
) {
  return {
    verificada: Boolean(guild.verificada),
    detectavel: ehDetectavel(guild.descobrivel, membros),
  };
}
