import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Ahead, Section, Title, Trail } from "~/components/docs/PecasDosDocs";
import { ObjectFields, ObjectEvents, ObjectRoutes } from "~/components/docs/ReferenciaDaApi";
import reference from "~/dados/referencia.json";

const find = (id: string) => reference.objects.find((object) => object.id === id);

export function generateStaticParams() {
  return reference.objects.map((object) => ({ objeto: object.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ objeto: string }>;
}): Promise<Metadata> {
  const object = find((await params).objeto);
  if (!object) return {};

  return {
    title: `${object.name} — Documentação do Gravaê`,
    description: object.summary,
  };
}

export default async function Obj({ params }: { params: Promise<{ objeto: string }> }) {
  const object = find((await params).objeto);
  if (!object) notFound();

  return (
    <article className="space-y-10">
      <header>
        <Trail group="Referência" page={object.name} />
        <Title call={object.summary}>{object.name}</Title>
      </header>

      {object.fields.length > 0 && (
        <Section id="campos" title="Campos">
          <p>
            Lidos do mesmo esquema que o servidor usa para validar. Campo que
            entrou na API aparece aqui sozinho; campo que saiu, some.
          </p>

          <ObjectFields fields={object.fields} />
        </Section>
      )}

      {object.routes.length > 0 && (
        <Section id="rotas" title="Rotas">
          <ObjectRoutes routes={object.routes} />
        </Section>
      )}

      {object.events.length > 0 && (
        <Section id="eventos" title="Eventos">
          <p>
            O que chega pela conexão de tempo real quando este objeto muda. O bot
            não precisa pedir: assim que entra num servidor, passa a receber.
          </p>

          <ObjectEvents events={object.events} />
        </Section>
      )}

      {object.routes.length === 0 && (
        <Section id="sem-rota" title="Sem rota REST">
          <p>
            Este objeto não tem rota própria: ele só existe pela conexão de tempo
            real. Para agir sobre ele, use os eventos que o bot envia.
          </p>
        </Section>
      )}

      <Ahead href="/desenvolvedores/referencia" />
    </article>
  );
}
