import { configuracoes } from "./root/configuracoes";
import { idioma } from "./root/idioma";

/*
  O catálogo é o conteúdo do namespace, sem envelope.

  O `resourcesToBackend` chama a função por (idioma, namespace) e espera
  receber o conteúdo daquele namespace — envolver num `{ traducao: ... }`
  faria ele procurar `traducao.configuracoes.telas.conta` e não achar nada.
*/
const catalogo = {
  configuracoes,
  idioma,
};

export default catalogo;
export const ptBR = catalogo;
