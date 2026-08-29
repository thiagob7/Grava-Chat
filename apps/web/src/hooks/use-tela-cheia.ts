import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

/*
  Tela cheia de um pedaço da tela — o quadro do vídeo, o palco, a janelinha.

  Existia copiado em dois lugares e ia virar três. Aqui num só porque as três
  regras que importam são as mesmas em todos:

  1. O estado vem do EVENTO do navegador, nunca do clique. Sair com Esc não
     passa pelo nosso botão, e sem escutar o evento o ícone ficaria mentindo.

  2. Alvo nulo cai no documento inteiro, em vez de não fazer nada. O
     `alvo.current?.requestFullscreen()` de antes devolvia `undefined` em
     silêncio quando o ref não estava montado — clique sem efeito e sem erro,
     que é a pior das duas coisas.

  3. Recusa do navegador vira aviso na tela. Silenciar o `catch` foi o que fez
     o botão parecer quebrado: se o navegador recusa, ele tem um motivo.

  No aplicativo de desktop isto sozinho não basta: o Electron coloca o ELEMENTO
  em tela cheia sem redimensionar a JANELA. Quem liga os dois é o processo
  principal (`enter-html-full-screen`, em `apps/desktop/src/main/janela.ts`),
  e isso só chega em quem instalou a v0.1.1 ou mais nova.
*/
export function useTelaCheia(alvo?: React.RefObject<HTMLElement | null>) {
  const [ativa, setAtiva] = useState(false);

  useEffect(() => {
    const sincronizar = () => setAtiva(Boolean(document.fullscreenElement));

    sincronizar();
    document.addEventListener("fullscreenchange", sincronizar);
    return () => document.removeEventListener("fullscreenchange", sincronizar);
  }, []);

  const alternar = useCallback(async () => {
    try {
      if (document.fullscreenElement) return void (await document.exitFullscreen());

      if (!document.fullscreenEnabled) {
        toast.error("Este navegador não está permitindo tela cheia aqui.");
        return;
      }

      await (alvo?.current ?? document.documentElement).requestFullscreen();
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : String(erro);
      toast.error(`Não consegui abrir em tela cheia: ${motivo}`);
    }
  }, [alvo]);

  return { ativa, alternar };
}
