/*
  A última versão publicada, direto do GitHub.

  Os botões de baixar poderiam apontar pro link permanente
  (`releases/latest/download/...`) e pronto — e apontam. O que a consulta
  acrescenta é o NÚMERO da versão e a data ao lado do botão: sem isso, ninguém
  que já tem o app instalado consegue saber, olhando a página, se vale a pena
  baixar de novo.

  Roda no navegador de quem visita, e não na build: o site é estático, e uma
  versão fixada no HTML envelheceria a cada release.
*/
export interface Publicada {
  versao: string;
  publicadaEm: string;
}

const REPO = "thiagob7/Grava-Chat";

export const LINK_MAC = `https://github.com/${REPO}/releases/latest/download/gravae-chat-mac.dmg`;
export const LINK_WINDOWS = `https://github.com/${REPO}/releases/latest/download/gravae-chat-win.exe`;
export const LINK_RELEASES = `https://github.com/${REPO}/releases`;

export async function buscarUltimaVersao(): Promise<Publicada> {
  const resposta = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!resposta.ok) throw new Error(`GitHub respondeu ${resposta.status}`);

  const dados = (await resposta.json()) as { tag_name: string; published_at: string };

  return {
    versao: dados.tag_name.replace(/^v/, ""),
    publicadaEm: dados.published_at,
  };
}
