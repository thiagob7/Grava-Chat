import { useEffect } from "react";

import { useAparencia } from "~/stores/aparencia";

/**
 * O tema saindo da preferência e chegando na tela.
 *
 * Dois atributos na raiz e uma variável — é tudo. As cores vivem no CSS
 * (`:root[data-tema="claro"]` e companhia), então trocar de tema aqui é
 * escrever uma palavra no `<html>`: nenhum componente sabe que existe tema,
 * e nada re-renderiza.
 */
export function useAparenciaAplicada() {
  const tema = useAparencia((s) => s.tema);
  const destaque = useAparencia((s) => s.destaque);
  const densidade = useAparencia((s) => s.densidade);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
  }, [tema]);

  useEffect(() => {
    document.documentElement.dataset.densidade = densidade;
  }, [densidade]);

  useEffect(() => {
    const raiz = document.documentElement;

    if (!destaque) {
      raiz.style.removeProperty("--color-brand");
      raiz.style.removeProperty("--color-brand-hover");
      return;
    }

    raiz.style.setProperty("--color-brand", destaque);
    /*
      O hover é a mesma cor um pouco mais escura. `color-mix` faz a conta no
      navegador — sem ele seria preciso guardar duas cores por opção e, pior,
      confiar que quem escolher a cor escolha as duas em harmonia.
    */
    raiz.style.setProperty(
      "--color-brand-hover",
      `color-mix(in oklab, ${destaque}, black 18%)`,
    );
  }, [destaque]);
}
