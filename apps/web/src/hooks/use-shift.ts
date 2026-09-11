import { useEffect, useState } from "react";

export function useShiftPressed() {
  const [shift, setShift] = useState(false);

  useEffect(() => {
    const onType = (e: KeyboardEvent) => setShift(e.shiftKey);
    const drop = () => setShift(false);

    window.addEventListener("keydown", onType);
    window.addEventListener("keyup", onType);
    window.addEventListener("blur", drop);

    return () => {
      window.removeEventListener("keydown", onType);
      window.removeEventListener("keyup", onType);
      window.removeEventListener("blur", drop);
    };
  }, []);

  return shift;
}
