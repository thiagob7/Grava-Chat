import type { NextConfig } from "next";

/*
  Site estático de verdade: `output: "export"` gera HTML puro, sem servidor
  Node nenhum atrás.

  A página não tem conta, sessão nem banco — ela mostra o que o Gravaê é e
  manda baixar. O único dado vivo (qual é a última versão publicada) vem do
  GitHub direto do navegador de quem visita, então não há o que renderizar no
  servidor. Assim ela pode ser servida de qualquer lugar, inclusive de graça.
*/
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
