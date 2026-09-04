import { useEffect, useState } from "react";

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
