"use client";

import { useQuery } from "@tanstack/react-query";

import { searchLastVersion } from "~/lib/release";

export const VersionPublished = ({ prefix = "Versão" }: { prefix?: string }) => {
  const { data } = useQuery({ queryKey: ["ultima-versao"], queryFn: searchLastVersion });

  if (!data) return null;

  return (
    <>
      {prefix} {data.version} ·{" "}
      {new Date(data.publishedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}
    </>
  );
};
