declare const __VERSAO__: string | undefined;
declare const __BRANCH__: string | undefined;
declare const __CONSTRUIDO_EM__: string | undefined;

const leia = (valor: string | undefined) => (valor && valor.length ? valor : null);

export const versaoDaApi = {
  commit: typeof __VERSAO__ === "string" ? leia(__VERSAO__) : null,
  branch: typeof __BRANCH__ === "string" ? leia(__BRANCH__) : null,
  construidoEm: typeof __CONSTRUIDO_EM__ === "string" ? leia(__CONSTRUIDO_EM__) : null,
};
