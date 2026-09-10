import type { CursorImportado } from "~/features/configuracoes/lib/cursor-importado";

/*
  O acervo inteiro do pacote, para escolher qualquer desenho em qualquer papel.

  O ponto de clique de cada um foi MEDIDO no próprio arquivo, e não estimado:
  para cada imagem, a primeira linha com pixel opaco, e dentro dela o meio do
  traço. Numa seta ou numa mão apontando, isso é a ponta — que é onde a pessoa
  acredita estar clicando.

  A tabela nasce de um script, e é por isso que ela é uma lista de tuplas em
  vez de um objeto bonito: assim uma linha é uma imagem, e regerar não vira um
  diff ilegível.
*/
const ACERVO: [string, string, number, number][] = [
  ["arrow_e", "Seta", 37, 14],
  ["arrow_n", "Seta", 31, 8],
  ["arrow_ne", "Seta", 37, 12],
  ["arrow_nw", "Seta", 25, 12],
  ["arrow_s", "Seta", 31, 8],
  ["arrow_se", "Seta", 23, 12],
  ["arrow_sw", "Seta", 40, 12],
  ["arrow_w", "Seta", 25, 14],
  ["boot", "Bota", 41, 4],
  ["bracket_a_horizontal", "Barra", 31, 20],
  ["bracket_a_vertical", "Barra", 31, 4],
  ["bracket_b_horizontal", "Barra", 31, 20],
  ["bracket_b_vertical", "Barra", 31, 4],
  ["busy_circle", "Ocupado", 31, 4],
  ["busy_circle_fade", "Ocupado", 31, 4],
  ["busy_hourglass", "Ocupado", 31, 4],
  ["busy_hourglass_outline", "Ocupado", 31, 4],
  ["busy_hourglass_outline_detail", "Ocupado", 31, 4],
  ["cross_large", "Cruz", 31, 4],
  ["cross_small", "Cruz", 31, 10],
  ["cursor_alias", "Cursor", 5, 2],
  ["cursor_busy", "Cursor", 9, 2],
  ["cursor_cogs", "Cursor", 11, 4],
  ["cursor_copy", "Cursor", 5, 2],
  ["cursor_disabled", "Cursor", 7, 2],
  ["cursor_exclamation", "Cursor", 17, 2],
  ["cursor_help", "Cursor", 11, 2],
  ["cursor_menu", "Cursor", 5, 2],
  ["cursor_none", "Cursor", 19, 6],
  ["disabled", "Bloqueado", 31, 4],
  ["door", "Porta", 31, 4],
  ["door_disabled", "Porta", 31, 4],
  ["door_enter", "Porta", 31, 4],
  ["door_exit", "Porta", 31, 4],
  ["dot_large", "Ponto", 31, 20],
  ["dot_small", "Ponto", 31, 24],
  ["drawing_brush", "Desenho", 25, 2],
  ["drawing_brush_large", "Desenho", 27, 0],
  ["drawing_bucket", "Desenho", 34, 4],
  ["drawing_eraser", "Desenho", 26, 6],
  ["drawing_pen", "Desenho", 18, 8],
  ["drawing_pencil", "Desenho", 15, 8],
  ["drawing_picker", "Desenho", 14, 6],
  ["drawing_spray", "Desenho", 31, 2],
  ["gauntlet_default", "Manopla", 8, 2],
  ["gauntlet_open", "Manopla", 21, 0],
  ["gauntlet_point", "Manopla", 8, 2],
  ["hand_closed", "Mão", 41, 8],
  ["hand_open", "Mão", 30, 3],
  ["hand_point", "Mão", 19, 4],
  ["hand_point_e", "Mão", 26, 4],
  ["hand_point_n", "Mão", 28, 0],
  ["hand_small_closed", "Mão", 35, 15],
  ["hand_small_open", "Mão", 31, 9],
  ["hand_small_point", "Mão", 22, 10],
  ["hand_small_point_e", "Mão", 28, 10],
  ["hand_small_point_n", "Mão", 29, 8],
  ["hand_thin_closed", "Mão", 36, 12],
  ["hand_thin_open", "Mão", 30, 5],
  ["hand_thin_point", "Mão", 18, 8],
  ["hand_thin_small_closed", "Mão", 31, 15],
  ["hand_thin_small_open", "Mão", 30, 11],
  ["hand_thin_small_point", "Mão", 22, 13],
  ["line_cross", "Linha", 31, 4],
  ["line_horizontal", "Linha", 31, 24],
  ["line_vertical", "Linha", 31, 4],
  ["lock", "Cadeado", 31, 6],
  ["lock_unlocked", "Cadeado", 31, 2],
  ["look_a", "Olhar", 31, 12],
  ["look_b", "Olhar", 31, 12],
  ["look_c", "Olhar", 31, 12],
  ["look_d", "Olhar", 31, 12],
  ["mark_exclamation", "Marca", 31, 6],
  ["mark_exclamation_pointer_b", "Marca", 17, 0],
  ["mark_question", "Marca", 31, 6],
  ["mark_question_pointer_b", "Marca", 15, 2],
  ["message_dots_round", "Mensagem", 31, 4],
  ["message_dots_square", "Mensagem", 31, 4],
  ["message_round", "Mensagem", 31, 4],
  ["message_square", "Mensagem", 31, 4],
  ["navigation_e", "Navegação", 19, 8],
  ["navigation_n", "Navegação", 31, 14],
  ["navigation_ne", "Navegação", 46, 12],
  ["navigation_nw", "Navegação", 18, 12],
  ["navigation_s", "Navegação", 31, 14],
  ["navigation_se", "Navegação", 43, 12],
  ["navigation_sw", "Navegação", 21, 12],
  ["navigation_w", "Navegação", 43, 8],
  ["pointer_a", "Ponteiro", 21, 12],
  ["pointer_b", "Ponteiro", 21, 12],
  ["pointer_b_shaded", "Ponteiro", 21, 12],
  ["pointer_c", "Ponteiro", 10, 4],
  ["pointer_c_shaded", "Ponteiro", 10, 4],
  ["pointer_d", "Ponteiro", 19, 12],
  ["pointer_e", "Ponteiro", 29, 12],
  ["pointer_f", "Ponteiro", 31, 12],
  ["pointer_g", "Ponteiro", 27, 12],
  ["pointer_h", "Ponteiro", 27, 8],
  ["pointer_i", "Ponteiro", 30, 16],
  ["pointer_j", "Ponteiro", 30, 12],
  ["pointer_k", "Ponteiro", 28, 12],
  ["pointer_l", "Ponteiro", 32, 12],
  ["pointer_scifi_a", "Ponteiro", 11, 6],
  ["pointer_scifi_b", "Ponteiro", 10, 5],
  ["pointer_toon_a", "Ponteiro", 13, 4],
  ["pointer_toon_b", "Ponteiro", 18, 10],
  ["progress_CCW_25", "Progresso", 31, 4],
  ["progress_CCW_50", "Progresso", 31, 4],
  ["progress_CCW_75", "Progresso", 31, 4],
  ["progress_CW_25", "Progresso", 31, 4],
  ["progress_CW_50", "Progresso", 31, 4],
  ["progress_CW_75", "Progresso", 31, 4],
  ["progress_empty", "Progresso", 31, 4],
  ["progress_full", "Progresso", 31, 4],
  ["resize_a_cross", "Redimensionar", 31, 4],
  ["resize_a_cross_diagonal", "Redimensionar", 32, 10],
  ["resize_a_diagonal", "Redimensionar", 41, 10],
  ["resize_a_diagonal_mirror", "Redimensionar", 22, 10],
  ["resize_a_horizontal", "Redimensionar", 31, 18],
  ["resize_a_vertical", "Redimensionar", 31, 4],
  ["resize_b_cross", "Redimensionar", 31, 4],
  ["resize_b_cross_diagonal", "Redimensionar", 31, 8],
  ["resize_b_diagonal", "Redimensionar", 41, 10],
  ["resize_b_diagonal_mirror", "Redimensionar", 22, 10],
  ["resize_b_horizontal", "Redimensionar", 31, 18],
  ["resize_b_vertical", "Redimensionar", 31, 4],
  ["resize_c_cross", "Redimensionar", 31, 0],
  ["resize_c_cross_diagonal", "Redimensionar", 31, 8],
  ["resize_c_diagonal", "Redimensionar", 44, 8],
  ["resize_c_diagonal_mirror", "Redimensionar", 19, 8],
  ["resize_c_horizontal", "Redimensionar", 31, 18],
  ["resize_c_vertical", "Redimensionar", 31, 0],
  ["resize_d_cross", "Redimensionar", 31, 0],
  ["resize_d_cross_diagonal", "Redimensionar", 31, 8],
  ["resize_d_diagonal", "Redimensionar", 44, 8],
  ["resize_d_diagonal_mirror", "Redimensionar", 19, 8],
  ["resize_d_horizontal", "Redimensionar", 31, 18],
  ["resize_d_vertical", "Redimensionar", 31, 0],
  ["resize_e_cross", "Redimensionar", 31, 3],
  ["resize_e_cross_diagonal", "Redimensionar", 31, 10],
  ["resize_e_diagonal", "Redimensionar", 36, 16],
  ["resize_e_diagonal_mirror", "Redimensionar", 27, 16],
  ["resize_e_horizontal", "Redimensionar", 31, 18],
  ["resize_e_vertical", "Redimensionar", 31, 12],
  ["resize_horizontal", "Redimensionar", 31, 1],
  ["resize_vertical", "Redimensionar", 31, 4],
  ["rotate_ccw", "Rotate", 31, 8],
  ["rotate_cw", "Rotate", 31, 8],
  ["rotate_horizontal_down", "Rotate", 31, 16],
  ["rotate_horizontal_up", "Rotate", 31, 8],
  ["stairs_down", "Stairs", 34, 6],
  ["stairs_up", "Stairs", 37, 6],
  ["steps", "Steps", 45, 0],
  ["target_a", "Target", 31, 2],
  ["target_b", "Target", 31, 4],
  ["target_round_a", "Target", 31, 2],
  ["target_round_b", "Target", 31, 4],
  ["tool_axe", "Ferramenta", 32, 2],
  ["tool_axe_single", "Ferramenta", 22, 8],
  ["tool_bomb", "Ferramenta", 44, 6],
  ["tool_bow", "Ferramenta", 42, 6],
  ["tool_hammer", "Ferramenta", 27, 4],
  ["tool_hoe", "Ferramenta", 27, 8],
  ["tool_pickaxe", "Ferramenta", 46, 2],
  ["tool_shovel", "Ferramenta", 24, 4],
  ["tool_sword_a", "Ferramenta", 15, 4],
  ["tool_sword_b", "Ferramenta", 14, 4],
  ["tool_torch", "Ferramenta", 26, 2],
  ["tool_wand", "Ferramenta", 24, 6],
  ["tool_watering_can", "Ferramenta", 41, 4],
  ["tool_wrench", "Ferramenta", 25, 6],
  ["tracking_horizontal", "Tracking", 31, 8],
  ["tracking_horizontal_down", "Tracking", 31, 16],
  ["tracking_horizontal_up", "Tracking", 31, 16],
  ["tracking_vertical", "Tracking", 31, 4],
  ["tracking_vertical_left", "Tracking", 39, 4],
  ["tracking_vertical_right", "Tracking", 23, 4],
  ["zoom", "Zoom", 27, 4],
  ["zoom_in", "Zoom", 27, 4],
  ["zoom_out", "Zoom", 27, 4],
  ["zoom_reset", "Zoom", 27, 4],
];

/*
  Os arquivos NÃO são embutidos no pacote (ver `vite.config.ts`): são 181, e
  embutir viraria quase 1 MB de texto que todo mundo baixa. Como arquivo solto,
  o navegador busca só os que aparecem na tela e guarda em cache.
*/
const ARQUIVOS = import.meta.glob<string>("../../../assets/cursores/biblioteca/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

const LADO = 64;

export interface ItemDaBiblioteca {
  id: string;
  familia: string;
  rotulo: string;
  cursor: CursorImportado;
}

const rotular = (id: string, familia: string) => {
  const resto = id.split("_").slice(1).join(" ");
  return resto ? `${familia} ${resto}` : familia;
};

export const BIBLIOTECA_DE_CURSORES: ItemDaBiblioteca[] = ACERVO.flatMap(
  ([id, familia, pontoX, pontoY]) => {
    const imagem = ARQUIVOS[`../../../assets/cursores/biblioteca/${id}.png`];
    if (!imagem) return [];

    return [
      {
        id,
        familia,
        rotulo: rotular(id, familia),
        cursor: { imagem, largura: LADO, altura: LADO, pontoX, pontoY },
      },
    ];
  },
);

export const FAMILIAS_DA_BIBLIOTECA = [
  ...new Set(BIBLIOTECA_DE_CURSORES.map((item) => item.familia)),
].sort((a, b) => a.localeCompare(b, "pt-BR"));
