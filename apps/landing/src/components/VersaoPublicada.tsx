"use client";

import { useQuery } from "@tanstack/react-query";

import { buscarUltimaVersao } from "~/lib/release";

/*
  Diz qual é a última versão e quando saiu.

  Enquanto carrega, não aparece nada — nem esqueleto, nem "carregando". Isto é
  um detalhe ao lado de um botão que já funciona sem ele: piscar um espaço
  reservado chamaria mais atenção pro carregamento do que a informação merece.
  Se o GitHub não responder, some, e o botão continua baixando a última versão
  do mesmo jeito.
*/
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
