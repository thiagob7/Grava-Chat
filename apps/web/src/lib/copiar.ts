
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* sem permissão, ou fora de contexto seguro: cai no plano B */
  }

  try {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    area.style.pointerEvents = "none";

    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, texto.length);

    const copiou = document.execCommand("copy");
    area.remove();

    return copiou;
  } catch {
    return false;
  }
}
