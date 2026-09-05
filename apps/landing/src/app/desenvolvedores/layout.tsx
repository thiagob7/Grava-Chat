import { Cabecalho } from "~/components/Cabecalho";
import { MenuDosDocs } from "~/components/MenuDosDocs";
import { Rodape } from "~/components/Rodape";

export default function LayoutDosDocs({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecalho />

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-24 pt-12 lg:flex-row lg:gap-12 lg:pt-16">
        <aside className="lg:w-56 lg:shrink-0">
          <MenuDosDocs />
        </aside>

        <main className="min-w-0 flex-1 space-y-10">{children}</main>
      </div>

      <Rodape />
    </>
  );
}
