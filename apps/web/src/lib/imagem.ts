/*
  Copiar e baixar uma imagem que veio da rede.

  As duas passam pelo `fetch` de propósito: um `<a download>` apontando para
  outro domínio faz o navegador NAVEGAR em vez de baixar, e a área de
  transferência só aceita um `Blob`, nunca uma URL.
*/
export async function baixarImagem(url: string, nome: string) {
  try {
    const resposta = await fetch(url);
    const arquivo = await resposta.blob();
    const endereco = URL.createObjectURL(arquivo);
    const ancora = document.createElement("a");

    ancora.href = endereco;
    ancora.download = nome;
    document.body.appendChild(ancora);
    ancora.click();
    ancora.remove();
    URL.revokeObjectURL(endereco);
  } catch {
    /// Sem CORS não dá para baixar por aqui; abrir resolve na mão.
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export async function copiarImagem(url: string): Promise<boolean> {
  try {
    const resposta = await fetch(url);
    const arquivo = await resposta.blob();

    /*
      A área de transferência só promete PNG. O que vem em outro formato passa
      por um canvas antes — e é aí que gif animado vira o primeiro quadro,
      que é o melhor possível sem inventar.
    */
    const png =
      arquivo.type === "image/png"
        ? arquivo
        : await new Promise<Blob | null>((resolver) => {
            const imagem = new Image();
            imagem.crossOrigin = "anonymous";
            imagem.onload = () => {
              const tela = document.createElement("canvas");
              tela.width = imagem.naturalWidth;
              tela.height = imagem.naturalHeight;
              tela.getContext("2d")?.drawImage(imagem, 0, 0);
              tela.toBlob(resolver, "image/png");
            };
            imagem.onerror = () => resolver(null);
            imagem.src = URL.createObjectURL(arquivo);
          });

    if (!png) return false;

    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    return true;
  } catch {
    return false;
  }
}
