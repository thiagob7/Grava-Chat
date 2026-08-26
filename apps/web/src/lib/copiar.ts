/**
 * Copia texto para a área de transferência.
 *
 * O `navigator.clipboard` sozinho não basta: quando a chamada sai de dentro
 * de um menu que acabou de fechar, o Chrome recusa com "Document is not
 * focused" — o foco ainda está voltando pro documento. Por isso a segunda
 * tentativa, com o `execCommand` antigo, que não depende disso.
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return copiarNaMarra(texto);
  }
}

function copiarNaMarra(texto: string): boolean {
  const campo = document.createElement("textarea");
  campo.value = texto;

  /// Fora da tela, mas não `display:none` nem `hidden`: o campo precisa poder
  /// receber seleção, e escondido de verdade ele não recebe.
  campo.setAttribute("readonly", "");
  campo.style.position = "fixed";
  campo.style.top = "-1000px";
  campo.style.opacity = "0";

  document.body.appendChild(campo);
  campo.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    campo.remove();
  }
}
