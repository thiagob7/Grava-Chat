import React from "react";
import Link from "next/link";

import { LimitsTable } from "~/components/docs/TabelaDeLimites";

const APP = "https://gravae-chat.vercel.app";
const REPO = "https://github.com/thiagob7/Grava-Chat";

const link = "text-brand transition hover:text-brand-hover";
const forte = "font-semibold text-ink";

const Outside = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className={link}>
    {children}
  </a>
);

export const BODIES: Record<string, React.ReactNode> = {
  "preciso-instalar": (
    <>
      <p>
        Não. O Gravaê{" "}
        <a href={APP} className={link}>
          abre no navegador
        </a>{" "}
        e funciona inteiro por lá.
      </p>
      <p>
        O{" "}
        <Link href="/baixar" className={link}>
          aplicativo para computador
        </Link>{" "}
        existe para quem quer atalho na barra de tarefas, avisos do sistema e transmissão de tela
        com o som do computador junto.
      </p>
    </>
  ),

  "quanto-custa": (
    <>
      <p>
        Nada. Não tem plano pago, não tem anúncio e o que você fala não é vendido para ninguém.
      </p>
      <p>
        O código é aberto — dá para{" "}
        <Outside href={REPO}>ler o que ele faz com os seus dados</Outside> em vez de acreditar na
        promessa.
      </p>
    </>
  ),

  "entrar-num-servidor": (
    <>
      <p>
        Por um link de convite que alguém de dentro te manda. Abra o link estando logado e você
        entra direto.
      </p>
      <p>
        Não existe busca pública de servidores: se ninguém te convidou, você não vê. As
        comunidades que aparecem em <span className={forte}>Explorar</span> são as que escolheram
        ficar visíveis.
      </p>
    </>
  ),

  "criar-um-servidor": (
    <>
      <p>
        No trilho da esquerda, o botão de <span className={forte}>+</span> embaixo da lista de
        servidores — o de "Criar ou entrar num servidor".
      </p>
      <p>
        Você dá um nome e uma imagem, e ele nasce com um canal de texto e um de voz. Quem cria é o
        dono, e o dono pode tudo.
      </p>
    </>
  ),

  "convidar-pessoas": (
    <>
      <p>
        No nome do servidor, em <span className={forte}>Convidar pessoas</span>.
      </p>
      <p>
        O link pode durar 30 minutos, algumas horas, 1 dia, 7 dias ou nunca expirar, e você pode
        limitar quantas pessoas ele aceita. Um link que expirou some sozinho — quem tentar usar
        depois não entra.
      </p>
    </>
  ),

  "tipos-de-canal": (
    <>
      <p>
        <span className={forte}>Texto</span> para conversa, <span className={forte}>voz</span> para
        chamada e <span className={forte}>fórum</span> para assuntos que rendem.
      </p>
      <p>
        No fórum cada assunto vira um post com a sua própria conversa, em vez de tudo se misturar
        num canal só.
      </p>
    </>
  ),

  "cargos-e-permissoes": (
    <>
      <p>
        Cada cargo carrega um conjunto de permissões — ver o canal, mandar mensagem, anexar
        arquivo, entrar na chamada, transmitir, expulsar, banir.
      </p>
      <p>
        Cada canal pode passar por cima do que o cargo diz. Um canal pode ser visível só para um
        cargo, ou de leitura para todo mundo e escrita só para a moderação.
      </p>
    </>
  ),

  "modo-lento": (
    <p>
      O <span className={forte}>modo lento</span> obriga a esperar entre uma mensagem e outra, de 5
      segundos a 6 horas. Quem tem a permissão de moderar passa por cima dele.
    </p>
  ),

  "editar-e-apagar": (
    <>
      <p>
        Dá, a qualquer momento. Mensagem editada ganha um <span className={forte}>(editado)</span>{" "}
        do lado — não dá para mudar o que você disse sem que apareça.
      </p>
      <p>Quem tem permissão de moderar também pode apagar mensagem dos outros.</p>
    </>
  ),

  "criar-enquete": (
    <>
      <p>
        No <span className={forte}>+</span> ao lado da caixa de texto, em{" "}
        <span className={forte}>Criar enquete</span>.
      </p>
      <p>
        Você escreve a pergunta e até cinco opções, e escolhe se cada pessoa pode votar em uma ou em
        várias. O resultado aparece na hora para todo mundo.
      </p>
    </>
  ),

  "expressoes-do-servidor": (
    <>
      <p>
        Todo servidor pode ter os seus. Emoji entra no meio da frase e nas reações, figurinha é a
        mensagem inteira, e som toca para quem está na chamada.
      </p>
      <p>
        Sobem nas configurações do servidor, por quem tem a permissão de gerenciar expressões.
      </p>
    </>
  ),

  "fixar-mensagem": (
    <p>
      Fixando. A mensagem fixada fica numa lista no topo do canal, e qualquer um do canal consegue
      voltar nela depois.
    </p>
  ),

  "entrar-numa-chamada": (
    <>
      <p>
        Clicando no canal de voz. Não toca para ninguém e não avisa: você entra, e quem já estava vê
        que você chegou.
      </p>
      <p>Para sair, o botão de desligar na barra de baixo.</p>
    </>
  ),

  "transmitir-a-tela": (
    <p>
      Dentro da chamada, no botão de transmitir. Você escolhe uma janela inteira ou só um
      aplicativo. Quem está na chamada vê um aviso de que você começou, e pode assistir clicando no
      seu quadro.
    </p>
  ),

  "som-da-transmissao": (
    <>
      <p>
        Levar o som do computador junto com a imagem é coisa do{" "}
        <Link href="/baixar" className={link}>
          aplicativo para computador
        </Link>
        .
      </p>
      <p>
        No navegador, o que dá para mandar depende do navegador — o Chrome consegue com o som de uma
        aba, e nada além disso. Se o som importa, use o aplicativo.
      </p>
    </>
  ),

  "microfone-nao-pega": (
    <>
      <p>
        Primeiro o navegador: ele precisa ter recebido permissão de microfone para o endereço do
        Gravaê.
      </p>
      <p>
        Depois, em Configurações → Voz, confira se o dispositivo escolhido é o certo — a barrinha de
        teste mostra na hora se ele está captando.
      </p>
    </>
  ),

  "sessoes-abertas": (
    <p>
      Em Configurações, na lista de sessões. Cada aparelho que entrou aparece ali, e dá para
      derrubar qualquer um deles — útil se você entrou num computador que não é seu e esqueceu de
      sair.
    </p>
  ),

  "exportar-dados": (
    <p>
      Pode, sem pedir para ninguém. Em Configurações tem a exportação: sai um arquivo com o seu
      perfil, os servidores em que você está, as suas amizades e as suas mensagens.
    </p>
  ),

  "aplicativos-autorizados": (
    <p>
      A lista de aplicativos autorizados fica em Configurações, e tirar a autorização é um clique. O
      aplicativo perde o acesso na hora.
    </p>
  ),

  "excluir-conta": (
    <>
      <p>
        Em Configurações, na exclusão da conta. Ela não some na hora: fica{" "}
        <span className={forte}>15 dias</span> marcada para excluir, e voltar a entrar nesse prazo
        cancela tudo. Passados os 15 dias, aí vai.
      </p>
      <p>
        Se você é dono de um servidor com outras pessoas dentro, o Gravaê não deixa excluir antes de
        você passar a posse ou apagar o servidor — para o lugar não ficar sem dono de uma hora para
        outra.
      </p>
    </>
  ),

  "limites-do-app": (
    <>
      <p>
        Os números valem para todo mundo, e são lidos do próprio código do Gravaê — o que está aqui
        é o que o servidor aceita hoje.
      </p>
      <LimitsTable />
    </>
  ),

  "nao-carrega": (
    <p>
      Veja o{" "}
      <Link href="/status" className={link}>
        status da plataforma
      </Link>
      : ele diz se o problema é nosso e há quanto tempo. A página de status é medida por fora, então
      ela continua honesta mesmo quando o resto não responde.
    </p>
  ),

  "reportar-bug": (
    <p>
      <Outside href={`${REPO}/issues/new`}>Abra uma issue</Outside>. Conte o que você fez, o que aconteceu
      e o que você esperava — com isso dá para consertar; sem isso, quase nunca.
    </p>
  ),

  "escrever-um-bot": (
    <p>
      Tem página só para isso:{" "}
      <Link href="/desenvolvedores" className={link}>
        documentação para desenvolvedores
      </Link>
      .
    </p>
  ),
};
