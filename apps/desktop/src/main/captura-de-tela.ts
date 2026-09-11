import { BrowserWindow, desktopCapturer, ipcMain, session, systemPreferences } from "electron";
import type { ScreenFont, ScreenChoice } from "@gravae/shared";

let pending: ((selection: ScreenChoice | null) => void) | null = null;

export function screenRegisterCapture() {
  ipcMain.handle("tela:escolhida", (_e, selection: ScreenChoice | null) => {
    pending?.(selection);
    pending = null;
  });

  ipcMain.handle("tela:permissao", () =>
    process.platform === "darwin" ? systemPreferences.getMediaAccessStatus("screen") : "granted",
  );

  session.defaultSession.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      const appWindow = BrowserWindow.getAllWindows()[0];
      if (!appWindow) return callback({});

      let fonts: Electron.DesktopCapturerSource[] = [];

      try {
        fonts = await desktopCapturer.getSources({
          types: ["screen", "window"],
          thumbnailSize: { width: 320, height: 180 },
          fetchWindowIcons: true,
        });
      } catch (error) {
        console.error("[desktop] não consegui listar as telas:", error);
      }

      let screens = 0;
      const list: ScreenFont[] = fonts.map((font) => {
        const isScreen = font.id.startsWith("screen:");
        if (isScreen) screens += 1;

        return {
          id: font.id,
          name: isScreen ? `Tela ${screens}` : font.name || "Janela",
          isScreen,
          thumbnail: font.thumbnail.isEmpty() ? null : font.thumbnail.toDataURL(),
          icon: font.appIcon && !font.appIcon.isEmpty() ? font.appIcon.toDataURL() : null,
        };
      });

      pending?.(null);

      const selection = await new Promise<ScreenChoice | null>((resolve) => {
        pending = resolve;
        appWindow.webContents.send("tela:escolher", list);
      });

      if (!selection) return callback({});

      const font = fonts.find((f) => f.id === selection.id);
      if (!font) return callback({});

      try {
        callback(selection.withAudio ? { video: font, audio: "loopback" } : { video: font });
      } catch (error) {
        console.error("[desktop] áudio do sistema indisponível, seguindo sem ele:", error);
        callback({ video: font });
      }
    },
    { useSystemPicker: false },
  );
}
