/**
 * Onde o aplicativo carrega o Gravaê.
 *
 * O desktop é uma casca em volta do MESMO front que roda no navegador — não uma
 * cópia empacotada em `file://`. É de propósito: com `file://` a origem vira
 * `null`, e aí o cookie httpOnly da sessão, o CORS e o callback do Google
 * passariam a ter regras diferentes das do navegador. Carregando por http(s) o
 * comportamento é idêntico ao que já está testado.
 *
 * Em desenvolvimento é o Vite (que também faz proxy da API). Depois da Fase 6,
 * `GRAVAE_APP_URL` no `.env` aponta pro endereço público.
 */
/** Vazio conta como ausente: a linha `GRAVAE_APP_URL=` do `.env` vem como "". */
const configurado = process.env.GRAVAE_APP_URL?.trim() || null;

export const APP_URL = configurado ?? "http://localhost:5173";

/** Origem de `APP_URL`, usada pra decidir o que é "dentro do app". */
export const APP_ORIGIN = new URL(APP_URL).origin;

/** Devtools abertas e afins: vale enquanto o app aponta pra máquina local. */
export const ehDev = configurado === null || /localhost|127\.0\.0\.1/.test(APP_ORIGIN);
