/*
  Variáveis de ambiente falsas, só para os testes conseguirem importar o app.

  O `env.ts` valida na importação e chama `process.exit(1)` quando falta algo —
  o que é a coisa certa em produção (subir sem `DATABASE_URL` seria subir para
  quebrar no primeiro pedido) e a coisa errada num teste: o processo morre antes
  da primeira asserção, e o vitest só diz que o arquivo "falhou ao carregar",
  sem dizer por quê.

  Foi o que manteve o `message-service.test.ts` morto: ele não testa banco nem
  Redis, mas importa um módulo que importa o `env`.

  Os valores são deliberadamente inválidos como destino — `localhost` em portas
  que ninguém escuta. Teste que tentar falar com eles falha de verdade, em vez
  de encostar por acidente num serviço que esteja rodando na máquina.
*/
const FALSAS: Record<string, string> = {
  NODE_ENV: "test",
  DATABASE_URL: "mongodb://127.0.0.1:1/gravae-test",
  REDIS_URL: "redis://127.0.0.1:1",
  JWT_SECRET: "segredo-de-teste-com-16+",
  COOKIE_SECRET: "segredo-de-teste-com-16+",
  R2_ENDPOINT: "http://127.0.0.1:1",
  R2_BUCKET: "teste",
  R2_ACCESS_KEY_ID: "teste",
  R2_SECRET_ACCESS_KEY: "teste",
  R2_PUBLIC_URL: "http://127.0.0.1:1",
};

for (const [chave, valor] of Object.entries(FALSAS)) {
  process.env[chave] ??= valor;
}
