"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/*
  O TanStack Query aqui existe por causa de UMA consulta: a última versão
  publicada no GitHub, que aparece ao lado dos botões de baixar.

  Um `useEffect` com `fetch` daria conta — e daria conta pior. A página tem
  três lugares que mostram a versão (o topo, a lista de download e o rodapé), e
  com o cliente eles compartilham a mesma resposta, com a mesma tentativa de
  novo e o mesmo cache. Com `useEffect` seriam três chamadas ao GitHub, que tem
  limite de 60 por hora por IP.

  O cliente nasce dentro de um `useState` porque este componente pode remontar:
  criá-lo no corpo faria um cliente novo a cada render, e cache que se perde a
  cada render não é cache.
*/
export const Provedores = ({ children }: { children: ReactNode }) => {
  const [cliente] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
};
