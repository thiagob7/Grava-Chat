/**
 * Copia texto para a área de transferência, com plano B.
 *
 * O `navigator.clipboard` não está sempre lá. Ele exige contexto seguro, e no
 * aplicativo isso depende de como a janela carregou a página — foi assim que o
 * "Copiar" do convite não funcionou no Windows enquanto funcionava no Mac. Pior:
 * a chamada devolve uma promessa, e quem a disparava com `void` ficava sem saber
 * que falhou. O aviso de "copiado" aparecia do mesmo jeito, com a área de
 * transferência vazia.
 *
 * O plano B é o truque antigo: um `<textarea>` fora de vista, selecionado, e o
 * `document.execCommand("copy")`. Ele é obsoleto e continua funcionando em todo
 * navegador que nos interessa — e, ao contrário da API nova, não depende de
 * contexto seguro nem de permissão.
 *
 * Devolve se conseguiu. Quem chama decide o que dizer — e precisa dizer algo:
 * "copiado" sem ter copiado é pior que um erro.
 */
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
    /*
      Fora de vista, mas NÃO `display: none` nem `visibility: hidden`: o que não
      é renderizado não pode ser selecionado, e sem seleção não há o que copiar.
      `position: fixed` no topo evita que o `select()` role a página.
    */
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
