import type { ThemeActive, ThemeShared } from "@gravae/shared";

import { api } from "~/@core/lib/api";

/*
  O corpo como ele PODE chegar, não como queremos que chegue.

  O web sobe sozinho quando um merge entra na master; a API sobe na mão, por
  script. Os dois nunca estão em passo, e na janela entre um e outro o web
  recebe o corpo antigo, sem os campos que acabou de aprender.

  Em 10/09/2026 isso derrubou o app inteiro: o cartão de tema lia
  `tema.ativos.length` e do outro lado o campo ainda não existia. Erro de tela
  branca, num cartão que aparece em canal.

  Campo novo entra por aqui com valor de reserva, nunca cru.
*/
export type ThemeArrived = Omit<ThemeShared, "actives"> & { actives?: ThemeActive[] };

export const normalizeTheme = (theme: ThemeArrived): ThemeShared => ({
  ...theme,
  actives: theme.actives ?? [],
});

export interface PublishThemeDto {
  css: string;
  overrides: Record<string, string>;
  actives: ThemeActive[];
  name?: string;
}

export async function publishTheme(data: PublishThemeDto): Promise<ThemeShared> {
  const response = await api.post<ThemeArrived>("/temas", data);
  return normalizeTheme(response.data);
}

export async function findTheme(themeId: string): Promise<ThemeShared> {
  const response = await api.get<ThemeArrived>(`/temas/${themeId}`);
  return normalizeTheme(response.data);
}

export async function findMineThemes(): Promise<ThemeShared[]> {
  const response = await api.get<ThemeArrived[]>("/temas");
  return response.data.map(normalizeTheme);
}

export async function deleteTheme(themeId: string): Promise<void> {
  await api.delete(`/temas/${themeId}`);
}
