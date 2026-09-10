import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Adiante, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";
import { CamposDoObjeto, EventosDoObjeto, RotasDoObjeto } from "~/components/docs/ReferenciaDaApi";
import referencia from "~/dados/referencia.json";

const achar = (id: string) => referencia.objetos.find((objeto) => objeto.id === id);

export function generateStaticParams() {
  return referencia.objetos.map((objeto) => ({ objeto: objeto.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ objeto: string }>;
}): Promise<Metadata> {
  const objeto = achar((await params).objeto);
  if (!objeto) return {};

  return {
    title: `${objeto.nome} — Documentação do Gravaê`,
    description: objeto.resumo,
  };
}

export default async function Objeto({ params }: { params: Promise<{ objeto: string }> }) {
  const objeto = achar((await params).objeto);
  if (!objeto) notFound();

  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Referência" pagina={objeto.nome} />
        <Titulo chamada={objeto.resumo}>{objeto.nome}</Titulo>
      </header>

      {objeto.campos.length > 0 && (
        <Secao id="campos" titulo="Campos">
          <p>
            Lidos do mesmo esquema que o servidor usa para validar. Campo que
            entrou na API aparece aqui sozinho; campo que saiu, some.
          </p>

          <CamposDoObjeto campos={objeto.campos} />
        </Secao>
      )}

      {objeto.rotas.length > 0 && (
        <Secao id="rotas" titulo="Rotas">
          <RotasDoObjeto rotas={objeto.rotas} />
        </Secao>
      )}

      {objeto.eventos.length > 0 && (
        <Secao id="eventos" titulo="Eventos">
          <p>
            O que chega pela conexão de tempo real quando este objeto muda. O bot
            não precisa pedir: assim que entra num servidor, passa a receber.
          </p>

          <EventosDoObjeto eventos={objeto.eventos} />
        </Secao>
      )}

      {objeto.rotas.length === 0 && (
        <Secao id="sem-rota" titulo="Sem rota REST">
          <p>
            Este objeto não tem rota própria: ele só existe pela conexão de tempo
            real. Para agir sobre ele, use os eventos que o bot envia.
          </p>
        </Secao>
      )}

      <Adiante href="/desenvolvedores/referencia" />
    </article>
  );
}
