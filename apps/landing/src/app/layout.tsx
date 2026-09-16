import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Providers } from "~/components/Provedores";
import "./globals.css";

const APP = "https://gravae-chat.vercel.app";

export const metadata: Metadata = {
  title: "Ravox Chat — conversa, voz e vídeo com os seus",
  description:
    "Chat com voz, vídeo e transmissão de tela para grupos de amigos. De graça, sem anúncio e sem vender o que você fala.",
  openGraph: {
    title: "Ravox Chat",
    description: "Conversa, voz e vídeo com os seus. De graça, sem anúncio.",
    type: "website",
  },
  alternates: { canonical: "/" },
  other: { "app-url": APP },
};

export const viewport: Viewport = {
  themeColor: "#080a0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
