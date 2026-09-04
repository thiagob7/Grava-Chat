"use client";

import { useQuery } from "@tanstack/react-query";

import { buscarUltimaVersao } from "~/lib/release";

export const VersaoPublicada = ({ prefixo = "Versão" }: { prefixo?: string }) => {
  const { data } = useQuery({ queryKey: ["ultima-versao"], queryFn: buscarUltimaVersao });

  if (!data) return null;

  return (
    <>
      {prefixo} {data.versao} ·{" "}
      {new Date(data.publicadaEm).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}
    </>
  );
};
