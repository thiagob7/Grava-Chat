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
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export async function copiarImagem(url: string): Promise<boolean> {
  try {
    const resposta = await fetch(url);
    const arquivo = await resposta.blob();

    const png =
      arquivo.type === "image/png"
        ? arquivo
        : await new Promise<Blob | null>((resolver) => {
            const imagem = new Image();
            imagem.crossOrigin = "anonymous";
            imagem.onload = () => {
              const screen = document.createElement("canvas");
              screen.width = imagem.naturalWidth;
              screen.height = imagem.naturalHeight;
              screen.getContext("2d")?.drawImage(imagem, 0, 0);
              screen.toBlob(resolver, "image/png");
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
