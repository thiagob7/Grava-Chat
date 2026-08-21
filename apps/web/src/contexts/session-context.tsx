import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { toast } from "react-toastify";

import { desktopLogin } from "~/@core/application/requests/auth/desktop-login";
import { useMe } from "~/@core/application/queries/auth/use-me";
import { useAuthConfig } from "~/@core/application/queries/auth/use-auth-config";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import { apiErrorMessage, refreshSession, setAccessToken, setSessionLostHandler } from "~/@core/lib/api";
import { desktop } from "~/lib/desktop";

interface SessionContextValue {
  user: SelfUserModel | null;
  /** true até a tentativa de restaurar a sessão terminar — evita piscar o login */
  isBooting: boolean;
  devLoginEnabled: boolean;
  googleEnabled: boolean;
  /** false quando o SFU só existe na máquina de quem hospeda */
  voiceReachable: boolean;
  apiUnreachable: boolean;
  retry: () => void;
  /** Chamado após um login bem-sucedido: semeia o cache e liga a sessão. */
  startSession: (user: SelfUserModel) => void;
  endSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * "localhost" no navegador de quem acessa é a máquina DELE. Se o SFU aponta pra
 * localhost e a página está sendo acessada de fora (ngrok, IP da rede), a voz
 * não tem como funcionar — melhor dizer isso antes da pessoa clicar.
 */
function alcancaOServidorDeVoz(voiceUrl: string | undefined): boolean {
  if (!voiceUrl) return true;

  const ehLocal = /\/\/(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(voiceUrl);
  const estouLocal = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

  return !ehLocal || estouLocal;
}

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Restaura a sessão a partir do cookie httpOnly.
 *
 * 401 é resposta definitiva: a sessão acabou mesmo. Qualquer outra falha é a
 * API indisponível naquele instante (reiniciando, proxy fora, rede oscilando) —
 * aí vale tentar de novo antes de mandar a pessoa pro login, que apagaria o
 * estado da tela por causa de dois segundos de servidor fora do ar.
 */
async function restaurarSessao<U>(tentativas = 4): Promise<U | null> {
  for (let tentativa = 0; tentativa < tentativas; tentativa++) {
    try {
      return (await refreshSession<U>()).user;
    } catch (erro) {
      const definitivo = axios.isAxiosError(erro) && erro.response?.status === 401;
      if (definitivo || tentativa === tentativas - 1) return null;

      await esperar(400 * 2 ** tentativa);
    }
  }

  return null;
}

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [isBooting, setIsBooting] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const config = useAuthConfig();
  const me = useMe(hasSession);

  /**
   * No carregamento da página o access token não existe (fica só em memória).
   * Tentar o refresh — que usa o cookie httpOnly — é o que restaura a sessão
   * depois de um F5.
   */
  useEffect(() => {
    void restaurarSessao<SelfUserModel>()
      .then((user) => {
        if (!user) {
          setAccessToken(null);
          setHasSession(false);
          return;
        }

        queryClient.setQueryData([queryKeys.auth.me], user);
        setHasSession(true);
      })
      .finally(() => setIsBooting(false));
  }, [queryClient]);

  /**
   * Aplicativo de desktop: o consentimento do Google acontece no navegador do
   * sistema e volta por `gravae://` como um código de uso único. Trocar esse
   * código aqui dentro é o que faz o cookie da sessão nascer na janela do
   * aplicativo — e não no navegador, que só serviu de passagem.
   */
  useEffect(() => {
    const ponte = desktop();
    if (!ponte) return;

    return ponte.login.aoReceber((dados) => {
      void desktopLogin(dados)
        .then((session) => {
          queryClient.setQueryData([queryKeys.auth.me], session.user);
          setHasSession(true);
        })
        .catch((erro) => {
          toast.error(apiErrorMessage(erro, "O login com Google não pôde ser concluído."));
        });
    });
  }, [queryClient]);

  // O servidor respondeu que a sessão acabou (401): derruba em vez de deixar
  // a UI num limbo. Falha de rede não chega aqui — ver o interceptor em api.ts.
  useEffect(() => {
    setSessionLostHandler(() => {
      setAccessToken(null);
      setHasSession(false);
      queryClient.clear();
    });
  }, [queryClient]);

  const value: SessionContextValue = {
    user: (me.data as SelfUserModel | undefined) ?? null,
    isBooting: isBooting || (hasSession && me.isLoading),
    devLoginEnabled: config.data?.devLogin ?? false,
    googleEnabled: config.data?.google ?? false,
    voiceReachable: alcancaOServidorDeVoz(config.data?.voiceUrl),
    apiUnreachable: config.isError,
    retry: () => {
      void config.refetch();
    },
    startSession: (user) => {
      // A resposta do login já traz o usuário; semear evita um GET /me à toa.
      queryClient.setQueryData([queryKeys.auth.me], user);
      setHasSession(true);
    },
    endSession: () => {
      setAccessToken(null);
      setHasSession(false);
      queryClient.clear();
    },
  };

  return <SessionContext value={value}>{children}</SessionContext>;
};

export const useSession = () => {
  const context = use(SessionContext);
  if (!context) throw new Error("useSession precisa estar dentro de SessionProvider");
  return context;
};

