import type { Secao } from "~/features/configuracoes/components/secoes";
import { useAparencia } from "~/features/configuracoes/stores/aparencia";
import { useAtalhos } from "~/features/configuracoes/stores/atalhos";
import { ATALHOS, escreverCombo } from "~/features/configuracoes/lib/atalhos";
import { useAvisos } from "~/stores/notificacoes";

export type CategoriaDeAjuste =
  | "aparencia"
  | "acessibilidade"
  | "bate-papo"
  | "midia"
  | "avisos"
  | "idioma"
  | "atalhos";

export const CATEGORIAS: { id: CategoriaDeAjuste; nome: string }[] = [
  { id: "aparencia", nome: "Aparência" },
  { id: "bate-papo", nome: "Bate-papo" },
  { id: "midia", nome: "Mídia" },
  { id: "avisos", nome: "Notificações" },
  { id: "acessibilidade", nome: "Acessibilidade" },
  { id: "idioma", nome: "Idioma" },
  { id: "atalhos", nome: "Atalhos" },
];

interface Base {
  id: string;
  categoria: CategoriaDeAjuste;
  rotulo: string;
  detalhe: string;
  tela: Secao;
  sub?: string;
}

export type Ajuste =
  | (Base & { tipo: "interruptor"; ler: () => boolean; escrever: (v: boolean) => void })
  | (Base & { tipo: "valor"; ler: () => string });

const aparencia = () => useAparencia.getState();
const avisos = () => useAvisos.getState();

const daAparencia = (
  campo:
    | "cantosArredondados"
    | "listaDeMembros"
    | "faixaDoServidor"
    | "lembrarCategoriasFechadas"
    | "reduzirAnimacao"
    | "focoSempreVisivel"
    | "horaEm24h"
    | "imagensDeLinks"
    | "imagensEnviadas"
    | "previaDeLinks"
    | "reacoes"
    | "avatares"
    | "sugestoes"
    | "emoticons"
    | "botaoDeEnviar"
    | "modoStreamer"
    | "streamerEscondeDados"
    | "streamerEscondeConvites"
    | "streamerSemSom"
    | "streamerSemAvisos",
) => ({
  ler: () => aparencia()[campo],
  escrever: (valor: boolean) => aparencia().definir({ [campo]: valor }),
});

const doAviso = (campo: "aviso" | "soMencoes" | "som" | "contador") => ({
  ler: () => avisos()[campo],
  escrever: (valor: boolean) => avisos().definir({ [campo]: valor }),
});

const TEMAS: Record<string, string> = {
  escuro: "Escuro",
  "mais-escuro": "Mais escuro",
  claro: "Claro",
  sistema: "Do sistema",
  gravae: "Gravaê",
};

const LEITURA: Record<string, string> = {
  nunca: "Nunca",
  sempre: "Sempre",
  "so-mencoes": "Só menções",
};

export const AJUSTES: Ajuste[] = [
  {
    id: "tema",
    categoria: "aparencia",
    rotulo: "Tema",
    detalhe: "A base clara ou escura de tudo.",
    tela: "aparencia",
    sub: "tema",
    tipo: "valor",
    ler: () => TEMAS[aparencia().tema] ?? aparencia().tema,
  },
  {
    id: "destaque",
    categoria: "aparencia",
    rotulo: "Cor de destaque",
    detalhe: "A cor dos botões e do que está selecionado.",
    tela: "aparencia",
    sub: "cor-de-destaque",
    tipo: "valor",
    ler: () => aparencia().destaque ?? "Padrão",
  },
  {
    id: "densidade",
    categoria: "aparencia",
    rotulo: "Espaçamento das mensagens",
    detalhe: "Confortável dá ar entre as mensagens; compacta cabe mais na tela.",
    tela: "bate-papo",
    sub: "exibicao",
    tipo: "valor",
    ler: () => (aparencia().densidade === "compacta" ? "Compacta" : "Confortável"),
  },
  {
    id: "zoom-do-app",
    categoria: "aparencia",
    rotulo: "Zoom do app",
    detalhe: "Aumenta tudo junto, como o zoom do navegador.",
    tela: "aparencia",
    sub: "zoom-do-app",
    tipo: "valor",
    ler: () => `${aparencia().zoomDoApp}%`,
  },
  {
    id: "escala-do-chat",
    categoria: "aparencia",
    rotulo: "Escala da fonte do chat",
    detalhe: "Mexe só no tamanho do texto das mensagens.",
    tela: "aparencia",
    sub: "escala-da-fonte",
    tipo: "valor",
    ler: () => `${aparencia().escalaDoChat}%`,
  },
  {
    id: "cantos-arredondados",
    categoria: "aparencia",
    rotulo: "Cantos arredondados",
    detalhe: "Arredonda os painéis e os cartões.",
    tela: "aparencia",
    sub: "interface",
    tipo: "interruptor",
    ...daAparencia("cantosArredondados"),
  },
  {
    id: "lista-de-membros",
    categoria: "aparencia",
    rotulo: "Lista de membros",
    detalhe: "A coluna da direita, com quem está no servidor.",
    tela: "aparencia",
    sub: "interface",
    tipo: "interruptor",
    ...daAparencia("listaDeMembros"),
  },
  {
    id: "faixa-do-servidor",
    categoria: "aparencia",
    rotulo: "Faixa do servidor",
    detalhe: "A imagem no topo da lista de canais.",
    tela: "aparencia",
    sub: "interface",
    tipo: "interruptor",
    ...daAparencia("faixaDoServidor"),
  },
  {
    id: "lembrar-categorias",
    categoria: "aparencia",
    rotulo: "Lembrar categorias fechadas",
    detalhe: "As categorias que você fecha continuam fechadas na volta.",
    tela: "aparencia",
    sub: "lista-de-canais",
    tipo: "interruptor",
    ...daAparencia("lembrarCategoriasFechadas"),
  },
  {
    id: "modo-streamer",
    categoria: "aparencia",
    rotulo: "Modo streamer",
    detalhe: "Esconde o que não pode aparecer numa transmissão.",
    tela: "aparencia",
    sub: "modo-streamer",
    tipo: "interruptor",
    ...daAparencia("modoStreamer"),
  },
  {
    id: "streamer-esconde-dados",
    categoria: "aparencia",
    rotulo: "Esconder meus dados na transmissão",
    detalhe: "Some com e-mail, telefone e código de convite pessoal.",
    tela: "aparencia",
    sub: "modo-streamer",
    tipo: "interruptor",
    ...daAparencia("streamerEscondeDados"),
  },
  {
    id: "streamer-esconde-convites",
    categoria: "aparencia",
    rotulo: "Esconder links de convite",
    detalhe: "Some com convite de servidor enquanto o modo streamer está ligado.",
    tela: "aparencia",
    sub: "modo-streamer",
    tipo: "interruptor",
    ...daAparencia("streamerEscondeConvites"),
  },
  {
    id: "streamer-sem-som",
    categoria: "aparencia",
    rotulo: "Silenciar os sons na transmissão",
    detalhe: "Cala os avisos sonoros enquanto o modo streamer está ligado.",
    tela: "aparencia",
    sub: "modo-streamer",
    tipo: "interruptor",
    ...daAparencia("streamerSemSom"),
  },
  {
    id: "streamer-sem-avisos",
    categoria: "aparencia",
    rotulo: "Não mostrar avisos na tela",
    detalhe: "Segura as notificações do sistema durante a transmissão.",
    tela: "aparencia",
    sub: "modo-streamer",
    tipo: "interruptor",
    ...daAparencia("streamerSemAvisos"),
  },
  {
    id: "reacoes",
    categoria: "bate-papo",
    rotulo: "Reações",
    detalhe: "Mostrar as reações embaixo das mensagens.",
    tela: "bate-papo",
    sub: "exibicao",
    tipo: "interruptor",
    ...daAparencia("reacoes"),
  },
  {
    id: "avatares",
    categoria: "bate-papo",
    rotulo: "Avatares",
    detalhe: "A foto de quem escreveu, ao lado da mensagem.",
    tela: "bate-papo",
    sub: "exibicao",
    tipo: "interruptor",
    ...daAparencia("avatares"),
  },
  {
    id: "spoilers",
    categoria: "bate-papo",
    rotulo: "Mostrar spoilers",
    detalhe: "Quando o conteúdo escondido se revela.",
    tela: "bate-papo",
    sub: "exibicao",
    tipo: "valor",
    ler: () => (aparencia().spoilers === "sempre" ? "Sempre" : "Ao clicar"),
  },
  {
    id: "sugestoes",
    categoria: "bate-papo",
    rotulo: "Sugestões enquanto digita",
    detalhe: "Completa emoji, pessoas e canais conforme você escreve.",
    tela: "bate-papo",
    sub: "entrada",
    tipo: "interruptor",
    ...daAparencia("sugestoes"),
  },
  {
    id: "emoticons",
    categoria: "bate-papo",
    rotulo: "Converter emoticons em emoji",
    detalhe: "Troca :) por 🙂 na hora de enviar.",
    tela: "bate-papo",
    sub: "entrada",
    tipo: "interruptor",
    ...daAparencia("emoticons"),
  },
  {
    id: "botao-de-enviar",
    categoria: "bate-papo",
    rotulo: "Botão de enviar",
    detalhe: "Mostra um botão ao lado da caixa, além do Enter.",
    tela: "bate-papo",
    sub: "entrada",
    tipo: "interruptor",
    ...daAparencia("botaoDeEnviar"),
  },
  {
    id: "imagens-de-links",
    categoria: "midia",
    rotulo: "Imagens e vídeos de links",
    detalhe: "Abrir a mídia que vem de um link colado.",
    tela: "bate-papo",
    sub: "midia",
    tipo: "interruptor",
    ...daAparencia("imagensDeLinks"),
  },
  {
    id: "imagens-enviadas",
    categoria: "midia",
    rotulo: "Imagens enviadas aqui",
    detalhe: "Abrir os anexos direto na conversa.",
    tela: "bate-papo",
    sub: "midia",
    tipo: "interruptor",
    ...daAparencia("imagensEnviadas"),
  },
  {
    id: "previa-de-links",
    categoria: "midia",
    rotulo: "Prévia de links",
    detalhe: "O cartão com título e descrição do site.",
    tela: "bate-papo",
    sub: "midia",
    tipo: "interruptor",
    ...daAparencia("previaDeLinks"),
  },
  {
    id: "aviso",
    categoria: "avisos",
    rotulo: "Aviso na tela",
    detalhe: "A janelinha do sistema quando chega mensagem.",
    tela: "avisos",
    sub: "geral",
    tipo: "interruptor",
    ...doAviso("aviso"),
  },
  {
    id: "contador",
    categoria: "avisos",
    rotulo: "Contador no título",
    detalhe: "O número de não lidas na aba e no ícone do app.",
    tela: "avisos",
    sub: "geral",
    tipo: "interruptor",
    ...doAviso("contador"),
  },
  {
    id: "so-mencoes",
    categoria: "avisos",
    rotulo: "Só quando me chamarem",
    detalhe: "Menção direta, cargo seu, @everyone e conversa privada.",
    tela: "avisos",
    sub: "preferencia-de-mencao",
    tipo: "interruptor",
    ...doAviso("soMencoes"),
  },
  {
    id: "som",
    categoria: "avisos",
    rotulo: "Sons",
    detalhe: "O interruptor de cima, que cala todos os sons de uma vez.",
    tela: "avisos",
    sub: "sons",
    tipo: "interruptor",
    ...doAviso("som"),
  },
  {
    id: "reduzir-animacao",
    categoria: "acessibilidade",
    rotulo: "Reduzir movimento",
    detalhe: "Corta aberturas, deslizes e transições.",
    tela: "acessibilidade",
    sub: "movimento",
    tipo: "interruptor",
    ...daAparencia("reduzirAnimacao"),
  },
  {
    id: "foco-sempre-visivel",
    categoria: "acessibilidade",
    rotulo: "Anel de foco sempre visível",
    detalhe: "Mostra onde está o foco mesmo usando o mouse.",
    tela: "acessibilidade",
    sub: "teclado",
    tipo: "interruptor",
    ...daAparencia("focoSempreVisivel"),
  },
  {
    id: "ler-em-voz-alta",
    categoria: "acessibilidade",
    rotulo: "Ler mensagens em voz alta",
    detalhe: "A mensagem que chega, lida pelo sintetizador do sistema.",
    tela: "acessibilidade",
    sub: "texto-em-voz",
    tipo: "valor",
    ler: () => LEITURA[aparencia().lerEmVozAlta] ?? aparencia().lerEmVozAlta,
  },
  {
    id: "hora-em-24h",
    categoria: "idioma",
    rotulo: "Hora em 24 horas",
    detalhe: "Desligado, mostra AM e PM.",
    tela: "idioma",
    sub: "formato-da-hora",
    tipo: "interruptor",
    ...daAparencia("horaEm24h"),
  },
];

const atalhos = () => useAtalhos.getState();

export function ajustesDosAtalhos(): Ajuste[] {
  return ATALHOS.filter((atalho) => !atalho.fixo).map((atalho) => ({
    id: `atalho-${atalho.id}`,
    categoria: "atalhos" as const,
    rotulo: atalho.nome,
    detalhe: `${atalho.detalhe} Hoje em ${escreverCombo(
      atalhos().trocados[atalho.id] ?? atalho.padrao,
    )}.`,
    tela: "atalhos" as Secao,
    sub: `atalhos-${atalho.area}`,
    tipo: "interruptor" as const,
    ler: () => !atalhos().desligados.includes(atalho.id),
    escrever: (valor: boolean) => atalhos().alternar(atalho.id, valor),
  }));
}
