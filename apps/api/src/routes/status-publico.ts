import type { FastifyInstance } from "fastify";

import { DIAS_GUARDADOS, PECAS, statusService } from "~/services/status-service.js";

/*
  O estado da plataforma, para qualquer pessoa.

  Sem autenticação, e de propósito: uma página de status que exige login é
  inútil justamente no dia em que o login não funciona. E por isso ela também
  não devolve NADA de máquina — nem memória, nem disco, nem quem está em
  chamada. Isso é do `routes/status.ts`, que fica atrás de administrador.

  O que sai daqui é o que se responde a um estranho: quais são as peças, se
  elas respondem agora, e quanto de cada dia elas responderam nos últimos
  noventa.
*/
export async function statusPublicoRoutes(app: FastifyInstance) {
  app.get("/publico/status", async (_req, reply) => {
    const [agora, janela] = await Promise.all([
      statusService.estadoAgora(),
      statusService.janela(),
    ]);

    /*
      Meio minuto de cache.

      A medição bate no Mongo, no Redis e no SFU a cada visita. Sem teto, uma
      página de status compartilhada num momento de queda vira ela mesma carga
      em cima do que já está mal — o oposto do que ela existe para fazer.
    */
    void reply.header("Cache-Control", "public, max-age=30, s-maxage=30");

    /*
      `*` porque o dado é público e a página que o lê mora noutro domínio.

      A lista de origens do `origins.ts` existe para proteger rota com sessão:
      lá o navegador manda o cookie junto, e origem desconhecida poderia agir
      como a pessoa. Aqui não há cookie nem lado a proteger — restringir só
      quebraria quem quisesse montar o próprio painel.
    */
    void reply.header("Access-Control-Allow-Origin", "*");

    return {
      pecas: PECAS,
      agora,
      janela,
      dias: DIAS_GUARDADOS,
      em: new Date().toISOString(),
    };
  });
}
