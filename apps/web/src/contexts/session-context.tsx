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
  isBooting: boolean;
  devLoginEnabled: boolean;
  googleEnabled: boolean;
  voiceReachable: boolean;
  apiUnreachable: boolean;
  retry: () => void;
  startSession: (user: SelfUserModel) => void;
  endSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function alcancaOServidorDeVoz(voiceUrl: string | undefined): boolean {
  if (!voiceUrl) return true;

  const ehLocal = /\/\/(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(voiceUrl);
  const estouLocal = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

  return !ehLocal || estouLocal;
}

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/// Teto da tela de abertura. Generoso de propósito: numa rede ruim, a primeira
/// resposta demora — e cortar cedo mandaria pro login quem ia entrar bem.
const TETO_DA_ABERTURA_MS = 20_000;

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

  const [demorouDemais, setDemorouDemais] = useState(false);

  useEffect(() => {
    const relogio = setTimeout(() => setDemorouDemais(true), TETO_DA_ABERTURA_MS);
    return () => clearTimeout(relogio);
  }, []);

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

  useEffect(() => {
    setSessionLostHandler(() => {
      setAccessToken(null);
      setHasSession(false);
      queryClient.clear();
    });
  }, [queryClient]);

  const value: SessionContextValue = {
    user: (me.data as SelfUserModel | undefined) ?? null,
    /*
      A tela de abertura tem hora pra acabar — a abertura INTEIRA.

      O teto precisa cobrir os dois trechos da espera, e não só o segundo. A
      restauração de sessão tenta quatro vezes antes de desistir; com um
      servidor que aceita a conexão e não responde, cada tentativa vai até o
      prazo do cliente HTTP, e a soma passa de dois minutos. Cobrindo só o
      `me.isLoading`, o logotipo continuava sozinho no preto esse tempo todo.

      Passado o teto, seguimos em frente: o app mostra o login, que já sabe
      dizer que o servidor não responde e segue tentando por conta.
    */
    isBooting: !demorouDemais && (isBooting || (hasSession && me.isLoading)),
    devLoginEnabled: config.data?.devLogin ?? false,
    googleEnabled: config.data?.google ?? false,
    voiceReachable: alcancaOServidorDeVoz(config.data?.voiceUrl),
    apiUnreachable: config.isError,
    retry: () => {
      void config.refetch();
    },
    startSession: (user) => {
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

