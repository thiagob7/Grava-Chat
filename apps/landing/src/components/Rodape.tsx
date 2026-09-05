import Image from "next/image";
import Link from "next/link";

import { VersaoPublicada } from "~/components/VersaoPublicada";

const REPO = "https://github.com/thiagob7/Grava-Chat";

export const Rodape = () => (
  <footer className="border-t border-line bg-surface-1">
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-[2fr_1fr_1fr]">
      <div>
        <Image src="/brand/logotipo.png" alt="Gravaê" width={112} height={28} className="h-7 w-auto" />
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
          Feito para conversar com os seus. Sem cobrar, sem anúncio e sem vender
          o que você fala.
        </p>
        <p className="mt-4 text-xs text-ink-faint">
          <VersaoPublicada prefixo="Versão do aplicativo:" />
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Gravaê</h3>
        <ul className="mt-3 space-y-2 text-sm text-ink-muted">
          <li>
            <Link href="/baixar" className="transition hover:text-ink">
              Baixar
            </Link>
          </li>
          <li>
            <a href="https://gravae-chat.vercel.app" className="transition hover:text-ink">
              Abrir no navegador
            </a>
          </li>
          <li>
            <a href={REPO} target="_blank" rel="noreferrer" className="transition hover:text-ink">
              Código-fonte
            </a>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Ajuda</h3>
        <ul className="mt-3 space-y-2 text-sm text-ink-muted">
          <li>
            <a
              href={`${REPO}/issues/new`}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-ink"
            >
              Relatar um problema
            </a>
          </li>
          <li>
            <a
              href={`${REPO}/releases`}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-ink"
            >
              Novidades de cada versão
            </a>
          </li>
          <li>
            <Link href="/status" className="transition hover:text-ink">
              Status da plataforma
            </Link>
          </li>
          <li>
            <Link href="/desenvolvedores" className="transition hover:text-ink">
              Documentação para bots
            </Link>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-line py-5 text-center text-xs text-ink-faint">
      © {new Date().getFullYear()} Gravaê
    </div>
  </footer>
);
