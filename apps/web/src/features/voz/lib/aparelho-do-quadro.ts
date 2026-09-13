import type { ElementType } from "react";
import { Globe, Monitor, Smartphone } from "lucide-react";
import type { VoiceDevice } from "@gravae/shared";

/*
  O desenho que representa cada aparelho na etiqueta do quadro.

  Quem entrou por uma versão antiga do cliente não manda aparelho, e aí não se
  desenha nada. Inventar um ícone para o caso desconhecido é pior que não
  mostrar nenhum: quem olha a etiqueta acredita no que ela diz.
*/
const BY_DEVICE = {
  desktop: Monitor,
  web: Globe,
  mobile: Smartphone,
} as const;

export function deviceIcon(device: VoiceDevice | null): ElementType | null {
  return device ? BY_DEVICE[device] : null;
}
