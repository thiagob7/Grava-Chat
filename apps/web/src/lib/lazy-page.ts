import React from "react";

const RELOAD_MARK = "gravae:chunk-reload";

const STALE = /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|dynamically imported module/i;

const isStale = (error: unknown) => STALE.test(error instanceof Error ? error.message : String(error));

const mark = {
  read: () => {
    try {
      return sessionStorage.getItem(RELOAD_MARK);
    } catch {
      return null;
    }
  },
  write: (value: string | null) => {
    try {
      if (value === null) sessionStorage.removeItem(RELOAD_MARK);
      else sessionStorage.setItem(RELOAD_MARK, value);
    } catch {
      return;
    }
  },
};

/*
  Quando sobe uma versão nova, os pedaços da versão antiga somem do servidor. Se
  a pessoa deixou a aba aberta e só então abriu uma tela que carrega sob demanda,
  o navegador vai buscar um arquivo que não existe mais. Não é erro dela nem do
  código: é a página velha pedindo peça velha. Então recarregamos uma vez, e só
  uma, para não entrar em laço se a falha for de rede mesmo.
*/
type Page = React.ComponentType<Record<string, unknown>>;

export function lazyPage<T extends Page>(load: () => Promise<{ default: T }>) {
  return React.lazy(async () => {
    try {
      const page = await load();
      mark.write(null);
      return page;
    } catch (error) {
      if (!isStale(error) || mark.read()) throw error;

      mark.write(String(Date.now()));
      window.location.reload();

      return new Promise<{ default: T }>(() => undefined);
    }
  });
}
