import { BrowserWindow, desktopCapturer, ipcMain, session, systemPreferences } from "electron";
import type { FonteDeTela, EscolhaDeTela } from "@gravae/shared";

/**
 * Compartilhar tela dentro do aplicativo.
 *
 * No navegador quem escolhe a janela é o Chrome, com o seletor dele, e o áudio
 * do sistema fica de fora (o navegador só entrega o som da *aba*). Aqui o
 * `getDisplayMedia` cai neste gancho: nós listamos as telas e janelas, o front
 * desenha o seletor com a cara do Gravaê, e a captura sai com `loopback` — o
 * som do jogo vai junto.
 */

/** Um pedido de cada vez: o front só mostra um seletor. */
let pendente: ((escolha: EscolhaDeTela | null) => void) | null = null;

export function registrarCapturaDeTela() {
  ipcMain.handle("tela:escolhida", (_e, escolha: EscolhaDeTela | null) => {
    pendente?.(escolha);
    pendente = null;
  });

  /**
   * `getMediaAccessStatus("screen")` no macOS não pergunta nada — só conta como
   * está. O pedido de verdade aparece sozinho na primeira captura; o que a
   * gente ganha aqui é poder avisar antes, em vez de o compartilhamento sair
   * preto sem explicação.
   */
  ipcMain.handle("tela:permissao", () =>
    process.platform === "darwin" ? systemPreferences.getMediaAccessStatus("screen") : "granted",
  );

  session.defaultSession.setDisplayMediaRequestHandler(
    async (_pedido, callback) => {
      const janela = BrowserWindow.getAllWindows()[0];
      if (!janela) return callback({});

      /**
       * Sem a permissão do macOS, `getSources` NÃO devolve lista vazia: ele
       * estoura. Sem este cerco, a promessa morria aqui, o `callback` nunca era
       * chamado e o `getDisplayMedia` do outro lado ficava pendurado pra
       * sempre — nenhum seletor, nenhum erro, nada acontecendo.
       *
       * Agora a lista vazia é resposta legítima: o seletor abre mesmo assim e
       * explica o que falta, com o botão que leva aos ajustes.
       */
      let fontes: Electron.DesktopCapturerSource[] = [];

      try {
        fontes = await desktopCapturer.getSources({
          types: ["screen", "window"],
          thumbnailSize: { width: 320, height: 180 },
          fetchWindowIcons: true,
        });
      } catch (erro) {
        console.error("[desktop] não consegui listar as telas:", erro);
      }

      let telas = 0;
      const lista: FonteDeTela[] = fontes.map((fonte) => {
        const ehTela = fonte.id.startsWith("screen:");
        // "Screen 1"/"Entire screen" não é pt-BR nem ajuda com dois monitores
        if (ehTela) telas += 1;

        return {
          id: fonte.id,
          nome: ehTela ? `Tela ${telas}` : fonte.name || "Janela",
          ehTela,
          miniatura: fonte.thumbnail.isEmpty() ? null : fonte.thumbnail.toDataURL(),
          icone: fonte.appIcon && !fonte.appIcon.isEmpty() ? fonte.appIcon.toDataURL() : null,
        };
      });

      // um pedido novo cancela o anterior em vez de deixar os dois abertos
      pendente?.(null);

      const escolha = await new Promise<EscolhaDeTela | null>((resolve) => {
        pendente = resolve;
        janela.webContents.send("tela:escolher", lista);
      });

      if (!escolha) return callback({});

      const fonte = fontes.find((f) => f.id === escolha.id);
      if (!fonte) return callback({});

      /**
       * `loopback` é o som do sistema inteiro — o que o navegador não sabe
       * fazer. Se a plataforma não suportar, cai pra vídeo puro: melhor
       * compartilhar sem som do que não compartilhar.
       */
      try {
        callback(escolha.comAudio ? { video: fonte, audio: "loopback" } : { video: fonte });
      } catch (erro) {
        console.error("[desktop] áudio do sistema indisponível, seguindo sem ele:", erro);
        callback({ video: fonte });
      }
    },
    // o seletor é nosso, não o do sistema
    { useSystemPicker: false },
  );
}
