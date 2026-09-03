import { comum } from "./root/comum";
import { configuracoes } from "./root/configuracoes";
import { conversa } from "./root/conversa";
import { idioma } from "./root/idioma";
import { perfil } from "./root/perfil";

/*
  O catálogo é o conteúdo do namespace, sem envelope.

  O `resourcesToBackend` chama a função por (idioma, namespace) e espera
  receber o conteúdo daquele namespace — envolver num `{ traducao: ... }`
  faria ele procurar `traducao.configuracoes.telas.conta` e não achar nada.
*/
const catalogo = {
  comum,
  configuracoes,
  conversa,
  idioma,
  perfil,
};

export default catalogo;
export const ptBR = catalogo;
