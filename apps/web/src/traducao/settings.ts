import { enUS } from "./en-us";
import { esMX } from "./es-mx";
import { ptBR } from "./pt-br";

/**
 * Os idiomas, e qual deles é a origem.
 *
 * `pt-BR` é o padrão E a origem — e essa é a diferença mais importante em
 * relação à referência, que tem inglês na origem. Este produto foi escrito e
 * pensado em português: o texto que está no código É o texto final, não uma
 * chave à espera de tradução. Inverter isso obrigaria a traduzir o app inteiro
 * para inglês antes de poder traduzir para qualquer coisa.
 */
export const fallbackLng = "pt-BR";
export const languages = [fallbackLng, "en-US", "es-MX"] as const;

export const defaultNS = "traducao";
export const storageKey = "gravae:idioma";

export type Idioma = (typeof languages)[number];

/*
  `typeof ptBR` como molde dos outros dois.

  É o que faz o TypeScript reclamar quando alguém acrescenta uma chave no
  português e esquece do inglês: o catálogo novo deixa de encaixar no molde e o
  build para. Sem isso a chave faltando só apareceria em produção, como o nome
  cru da chave no meio da tela.

  Por isso os catálogos NÃO usam `as const`: com literais, o molde exigiria
  que o inglês dissesse "Minha conta" — o tipo passaria a checar o texto em vez
  do formato, que é o contrário do que se quer aqui.
*/
export const resources: Record<Idioma, typeof ptBR> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "es-MX": esMX,
};

/**
 * Como cada idioma se apresenta na lista.
 *
 * `nativo` primeiro e `nome` depois, e não o contrário: quem procura o próprio
 * idioma numa lista de trinta procura pela palavra que ELE usa. "Español" acha
 * quem fala espanhol; "Spanish" acha quem já está lendo em inglês — e quem já
 * está lendo em inglês não precisa desta tela.
 */
export const IDIOMAS: {
  lng: Idioma;
  nativo: string;
  nome: string;
  bandeira: string;
}[] = [
  {
    lng: "pt-BR",
    nativo: "Português do Brasil",
    nome: "Brazilian Portuguese",
    bandeira: "🇧🇷",
  },
  { lng: "en-US", nativo: "English (US)", nome: "Inglês", bandeira: "🇺🇸" },
  { lng: "es-MX", nativo: "Español", nome: "Espanhol", bandeira: "🇲🇽" },
];
