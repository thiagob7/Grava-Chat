export const CAMINHO_DO_CONVITE = "/invite/";

export function codigoDoConviteNoLink(url: string, origem: string): string | null {
  try {
    const endereco = new URL(url, origem);
    if (endereco.origin !== new URL(origem).origin) return null;

    const encontrado = new RegExp(`^${CAMINHO_DO_CONVITE}([A-Za-z0-9_-]{4,32})$`).exec(
      endereco.pathname,
    );

    return encontrado?.[1] ?? null;
  } catch {
    return null;
  }
}
