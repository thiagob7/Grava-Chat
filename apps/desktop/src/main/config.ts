
const embedded = process.env.GRAVAE_APP_URL_EMBEDDED?.trim() || null;
const configured = process.env.GRAVAE_APP_URL?.trim() || embedded;

export const APP_URL = configured ?? "http://localhost:5173";

export const APP_ORIGIN = new URL(APP_URL).origin;

export const isDev = configured === null || /localhost|127\.0\.0\.1/.test(APP_ORIGIN);
