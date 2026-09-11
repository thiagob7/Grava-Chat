import { GROUPS } from "~/dados/docs";
import reference from "~/dados/referencia.json";

export type Found = {
  title: string;
  context: string;
  href: string;
  kind: "Página" | "Rota" | "Evento" | "Permissão" | "Limite";
};

const pages: Found[] = GROUPS.flatMap((group) =>
  group.pages.map((page) => ({
    title: page.title,
    context: page.summary,
    href: page.href,
    kind: "Página" as const,
  })),
);

const routes: Found[] = reference.rest.map((route) => ({
  title: `${route.method} ${route.path}`,
  context: route.description,
  href: "/desenvolvedores/referencia",
  kind: "Rota",
}));

const sent: Found[] = reference.events.map((event) => ({
  title: event.name,
  context: `Evento que o bot envia — ${
    event.fields.map((field) => field.name).join(", ") || "sem campos"
  }`,
  href: "/desenvolvedores/eventos#enviados",
  kind: "Evento",
}));

const received: Found[] = reference.received.map((event) => ({
  title: event.name,
  context: event.description,
  href: "/desenvolvedores/eventos#recebidos",
  kind: "Evento",
}));

const permissions: Found[] = reference.permissions.flatMap((group) =>
  group.items.map((item) => ({
    title: item.name,
    context: `${item.key} — ${item.description}`,
    href: "/desenvolvedores/permissoes",
    kind: "Permissão" as const,
  })),
);

const limits: Found[] = reference.limits.map((limit) => ({
  title: limit.label,
  context: "Limite que o servidor aplica",
  href: "/desenvolvedores/limites",
  kind: "Limite",
}));

export const INDEX: Found[] = [
  ...pages,
  ...routes,
  ...sent,
  ...received,
  ...permissions,
  ...limits,
];

const withoutAccent = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const search = (term: string) => {
  const target = withoutAccent(term.trim());

  if (!target) return [];

  return INDEX.map((match) => {
    const title = withoutAccent(match.title);
    const context = withoutAccent(match.context);

    if (title.startsWith(target)) return { match, weight: 0 };
    if (title.includes(target)) return { match, weight: 1 };
    if (context.includes(target)) return { match, weight: 2 };

    return null;
  })
    .filter((line) => line !== null)
    .sort((a, b) => a.weight - b.weight)
    .slice(0, 12)
    .map((line) => line.match);
};
