// Em desenvolvimento a URL vem do .env em tempo de execucao. No app empacotado
// ela e trocada pelo tsup no momento do build (env: GRAVAE_APP_URL_EMBUTIDO),
// porque .dmg instalado nao le .env de lugar nenhum.
const embutido = process.env.GRAVAE_APP_URL_EMBUTIDO?.trim() || null;
const configurado = process.env.GRAVAE_APP_URL?.trim() || embutido;

export const APP_URL = configurado ?? "http://localhost:5173";

export const APP_ORIGIN = new URL(APP_URL).origin;

export const ehDev = configurado === null || /localhost|127\.0\.0\.1/.test(APP_ORIGIN);
