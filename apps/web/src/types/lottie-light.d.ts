/**
 * A build LEVE do lottie-web, que não vem com tipos próprios.
 *
 * Ela tira o suporte a expressões do After Effects — que nenhuma decoração usa —
 * e com isso o arquivo cai pela metade e some o `eval` que o build acusava. O
 * tipo é o mesmo da build completa.
 */
declare module "lottie-web/build/player/lottie_light" {
  import type { LottiePlayer } from "lottie-web";

  const lottie: LottiePlayer;
  export default lottie;
}
