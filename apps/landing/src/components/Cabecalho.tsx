import Image from "next/image";
import Link from "next/link";

const APP = "https://gravae-chat.vercel.app";

export const Cabecalho = () => (
  <header className="sticky top-0 z-50 border-b border-line/70 bg-surface-0/80 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <Image src="/brand/logotipo.png" alt="Gravaê" width={112} height={28} className="h-7 w-auto" />
        <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
          beta
        </span>
      </Link>

      <nav className="hidden items-center gap-5 text-sm text-ink-muted sm:flex">
        <Link href="/baixar" className="transition hover:text-ink">
          Baixar
        </Link>
        <a href="#recursos" className="transition hover:text-ink">
          O que ele faz
        </a>
        <a
          href="https://github.com/thiagob7/Grava-Chat"
          className="transition hover:text-ink"
          target="_blank"
          rel="noreferrer"
        >
          Código
        </a>
      </nav>

      <a
        href={APP}
        className="ml-auto shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        Abrir o Gravaê
      </a>
    </div>
  </header>
);
