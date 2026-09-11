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
  passwordEnabled: boolean;
  forgotPasswordEnabled: boolean;
  voiceReachable: boolean;
  apiUnreachable: boolean;
  retry: () => void;
  startSession: (user: SelfUserModel) => void;
  endSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function voiceReachesServer(voiceUrl: string | undefined): boolean {
  if (!voiceUrl) return true;

  const isLocal = /\/\/(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(voiceUrl);
  const amLocal = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

  return !isLocal || amLocal;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const OPENING_MS_CEILING = 20_000;

async function restoreSession<U>(attempts = 4): Promise<U | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return (await refreshSession<U>()).user;
    } catch (error) {
      const final = axios.isAxiosError(error) && error.response?.status === 401;
      if (final || attempt === attempts - 1) return null;

      await wait(400 * 2 ** attempt);
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

  const [tookToo, setTookToo] = useState(false);

  useEffect(() => {
    const clock = setTimeout(() => setTookToo(true), OPENING_MS_CEILING);
    return () => clearTimeout(clock);
  }, []);

  useEffect(() => {
    void restoreSession<SelfUserModel>()
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
    const bridge = desktop();
    if (!bridge) return;

    return bridge.login.onReceive((data) => {
      void desktopLogin(data)
        .then((session) => {
          queryClient.setQueryData([queryKeys.auth.me], session.user);
          setHasSession(true);
        })
        .catch((error) => {
          toast.error(apiErrorMessage(error, "O login com Google não pôde ser concluído."));
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
    isBooting: !tookToo && (isBooting || (hasSession && me.isLoading)),
    devLoginEnabled: config.data?.devLogin ?? false,
    googleEnabled: config.data?.google ?? false,
    passwordEnabled: config.data?.password ?? false,
    forgotPasswordEnabled: config.data?.forgotPassword ?? false,
    voiceReachable: voiceReachesServer(config.data?.voiceUrl),
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

  return <SessionContext data-gc="contexts.session-context.session-context" value={value}>{children}</SessionContext>;
};

export const useSession = () => {
  const context = use(SessionContext);
  if (!context) throw new Error("useSession precisa estar dentro de SessionProvider");
  return context;
};

