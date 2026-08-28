import { useQuery } from "@tanstack/react-query";

import { findAuthConfig } from "~/@core/application/requests/auth/find-auth-config";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/**
 * A primeira coisa que o app pergunta à API — e por isso a que decide se ele
 * mostra a tela de login ou o aviso de "não consegui falar com a API".
 *
 * Com `retry: 1` ela desistia em duas tentativas. Publicar a API derruba o
 * processo por alguns segundos (`systemctl restart`), e nessa janela todo mundo
 * com o app aberto via um erro vermelho definitivo para um problema que se
 * resolve sozinho meio minuto depois.
 *
 * Agora ela insiste com espera crescente (~30s no total) e, se ainda assim
 * falhar, continua tentando de fundo. Quem estiver com a tela aberta durante um
 * deploy volta a funcionar sem clicar em nada.
 */
export const useAuthConfig = () =>
  useQuery({
    queryKey: [queryKeys.auth.config],
    queryFn: findAuthConfig,

    retry: 6,
    /// 1s, 2s, 4s, 8s, 8s, 8s — o teto evita que a última espera fique tão
    /// longa que a recuperação pareça travamento.
    retryDelay: (tentativa) => Math.min(1000 * 2 ** tentativa, 8000),

    /*
      A rede de baixo: se as seis tentativas acabarem e a API ainda estiver
      fora, seguimos batendo a cada 5s. É o que transforma o aviso numa espera
      em vez de um beco sem saída — no segundo em que a API volta, o app volta.
    */
    refetchInterval: (query) => (query.state.status === "error" ? 5000 : false),
    refetchIntervalInBackground: false,
  });
