import { useEffect, useState } from "react";

/**
 * Se o Shift está pressionado agora. É o que revela as ações escondidas na
 * barra da mensagem, como no Discord.
 *
 * Ouve `blur` da janela junto com o `keyup`: trocar de aplicativo com o Shift
 * na mão nunca devolve o `keyup`, e a barra ficaria aberta pra sempre.
 */
export function useShiftPressionado() {
  const [shift, setShift] = useState(false);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => setShift(e.shiftKey);
    const soltar = () => setShift(false);

    window.addEventListener("keydown", aoTeclar);
    window.addEventListener("keyup", aoTeclar);
    window.addEventListener("blur", soltar);

    return () => {
      window.removeEventListener("keydown", aoTeclar);
      window.removeEventListener("keyup", aoTeclar);
      window.removeEventListener("blur", soltar);
    };
  }, []);

  return shift;
}
