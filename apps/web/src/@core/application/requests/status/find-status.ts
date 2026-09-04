import { api } from "~/@core/lib/api";

export interface ParticipanteDaSala {
  id: string;
  nome: string;
  avatarUrl: string | null;
  /// "sem" = nem publicou microfone (ouvinte, ou entrada que travou)
  microfone: "aberto" | "mudo" | "sem";
  camera: boolean;
  tela: boolean;
  entrouEm: number;
  /// está no SFU sem o app saber: a varredura devia ter expulsado
  soNoSfu: boolean;
}

/// O app acha que a pessoa está em chamada, o SFU não a vê.
export interface FantasmaDeVoz {
  id: string;
  nome: string;
  canal: string | null;
  desde: number;
  aguardandoVolta: boolean;
}

export interface SalaDeVoz {
  canalId: string;
  /// `null` = sala viva no SFU sem canal no banco; veja `motivo`
  nome: string | null;
  servidor: string | null;
  ehPrivado: boolean;
  /*
    Por que a sala não tem canal:
    - "canal-apagado": o canal foi apagado com a chamada ainda dentro
    - "outro-ambiente": este SFU é de outro ambiente (o .env de dev aponta pro
      LiveKit de produção), então nem as pessoas são deste banco
  */
  motivo: "canal-apagado" | "outro-ambiente" | null;
  criadaEm: number;
  participantes: ParticipanteDaSala[];
}

export interface ChecagemDeServico {
  nome: string;
  estado: "up" | "down";
  ms: number;
}

/// A outra VM: a que roda o LiveKit. Vem do agente de `infra/sfu/`, porque a
/// API só consegue se auto-medir — `os.loadavg()` não atravessa a rede.
export interface MaquinaDeVoz {
  indisponivel?: false;
  host: string;
  nucleos: number;
  carga: { um: number; cinco: number; quinze: number };
  memoria: { total: number; livre: number; disponivel: number };
  disco: { total: number; livre: number };
  uptimeDaMaquina: number;
  livekit: { noAr: boolean; residente: number };
  /// Ida e volta até o agente. Rede lenta entre as VMs aparece aqui antes de
  /// aparecer como chamada picotada.
  ms: number;
}

export interface StatusDoServidor {
  api: {
    host: string;
    ambiente: string;
    carga: { um: number; cinco: number; quinze: number };
    nucleos: number;
    memoria: { total: number; livre: number; disponivel: number };
    residente: number;
    disco: { total: number; livre: number } | null;
    uptimeDoProcesso: number;
    uptimeDaMaquina: number;
    node: string;
  };
  gateway: { conexoes: number; pessoas: number; bots: number } | null;
  /// `null` = não há segunda máquina configurada (desenvolvimento). O objeto com
  /// `indisponivel` é outra coisa: existe e não respondeu.
  voz: MaquinaDeVoz | { indisponivel: true } | null;
  mongo: ChecagemDeServico;
  redis: ChecagemDeServico;
  sfu: {
    indisponivel?: true;
    salas: SalaDeVoz[];
    participantes: number;
    publicando: number;
    fantasmas: FantasmaDeVoz[];
  };
}

export async function findStatus(): Promise<StatusDoServidor> {
  const response = await api.get<StatusDoServidor>("/status");
  return response.data;
}
