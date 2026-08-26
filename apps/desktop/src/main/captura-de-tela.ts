import { BrowserWindow, desktopCapturer, ipcMain, session, systemPreferences } from "electron";
import type { FonteDeTela, EscolhaDeTela } from "@gravae/shared";

let pendente: ((escolha: EscolhaDeTela | null) => void) | null = null;

export function registrarCapturaDeTela() {
  ipcMain.handle("tela:escolhida", (_e, escolha: EscolhaDeTela | null) => {
    pendente?.(escolha);
    pendente = null;
  });

  ipcMain.handle("tela:permissao", () =>
    process.platform === "darwin" ? systemPreferences.getMediaAccessStatus("screen") : "granted",
  );

  session.defaultSession.setDisplayMediaRequestHandler(
    async (_pedido, callback) => {
      const janela = BrowserWindow.getAllWindows()[0];
      if (!janela) return callback({});

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
        if (ehTela) telas += 1;

        return {
          id: fonte.id,
          nome: ehTela ? `Tela ${telas}` : fonte.name || "Janela",
          ehTela,
          miniatura: fonte.thumbnail.isEmpty() ? null : fonte.thumbnail.toDataURL(),
          icone: fonte.appIcon && !fonte.appIcon.isEmpty() ? fonte.appIcon.toDataURL() : null,
        };
      });

      pendente?.(null);

      const escolha = await new Promise<EscolhaDeTela | null>((resolve) => {
        pendente = resolve;
        janela.webContents.send("tela:escolher", lista);
      });

      if (!escolha) return callback({});

      const fonte = fontes.find((f) => f.id === escolha.id);
      if (!fonte) return callback({});

      try {
        callback(escolha.comAudio ? { video: fonte, audio: "loopback" } : { video: fonte });
      } catch (erro) {
        console.error("[desktop] áudio do sistema indisponível, seguindo sem ele:", erro);
        callback({ video: fonte });
      }
    },
    { useSystemPicker: false },
  );
}
