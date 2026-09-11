import React, { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import {
  noticeRequestPermission,
  noticePermission,
  type NoticePermission,
} from "~/lib/notificacoes";
import { useNotices } from "~/stores/notificacoes";
import { SOUNDS_GROUPS, playSound } from "~/lib/ui-sounds";
import { Play } from "lucide-react";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { desktop } from "~/lib/desktop";

export const NotificationsSection: React.FC = () => {
  const prefs = useNotices();
  const [permission, setPermission] = useState<NoticePermission>(() =>
    noticePermission(),
  );

  useEffect(() => {
    const reread = () => setPermission(noticePermission());
    document.addEventListener("visibilitychange", reread);
    return () => document.removeEventListener("visibilitychange", reread);
  }, []);

  const bridge = desktop();

  return (
    <div data-gc="configuracoes.notifications-section.div" className="max-w-xl">
      <p data-gc="configuracoes.notifications-section.p" className="text-sm text-ink-muted">
        Vale para este aparelho. A mesma conta aberta no trabalho pode ficar
        quieta enquanto a de casa apita.
      </p>

      {permission === "perguntar" && (
        <div data-gc="configuracoes.notifications-section.div--2" className="mt-5 flex items-start gap-3 rounded bg-brand/10 p-3">
          <Bell data-gc="configuracoes.notifications-section.bell" size={18} className="mt-0.5 shrink-0 text-brand" />
          <div data-gc="configuracoes.notifications-section.div--3" className="min-w-0 flex-1">
            <p data-gc="configuracoes.notifications-section.p--2" className="text-sm font-medium">Falta o sistema deixar</p>
            <p data-gc="configuracoes.notifications-section.p--3" className="mt-0.5 text-xs text-ink-muted">
              O aviso na tela precisa de uma autorização do{" "}
              {bridge ? "sistema" : "navegador"}. Sem ela, o som e o contador no
              título continuam funcionando.
            </p>
            <Button data-gc="configuracoes.notifications-section.button"
              size="sm"
              className="mt-2"
              onClick={() => void noticeRequestPermission().then(setPermission)}
            >
              Permitir avisos
            </Button>
          </div>
        </div>
      )}

      {permission === "negada" && (
        <div data-gc="configuracoes.notifications-section.div--4" className="mt-5 flex items-start gap-3 rounded bg-idle/10 p-3">
          <BellOff data-gc="configuracoes.notifications-section.bell-off" size={18} className="mt-0.5 shrink-0 text-idle" />
          <div data-gc="configuracoes.notifications-section.div--5" className="min-w-0 flex-1">
            <p data-gc="configuracoes.notifications-section.p--4" className="text-sm font-medium">Os avisos estão bloqueados</p>
            <p data-gc="configuracoes.notifications-section.p--5" className="mt-0.5 text-xs text-ink-muted">
              {bridge
                ? "Libere o Gravaê em Ajustes do Sistema → Notificações."
                : "O navegador guardou um “bloquear” para este endereço — o botão de pedir não aparece mais. Libere no cadeado ao lado da barra de endereço."}{" "}
              O som e o contador no título não dependem disso.
            </p>
          </div>
        </div>
      )}

      <Section data-gc="configuracoes.notifications-section.section"
        id="geral"
        title="Geral"
        detail="O que te interrompe enquanto o Gravaê está atrás de outra coisa."
      >
        <Choice data-gc="configuracoes.notifications-section.choice"
          title="Aviso na tela"
          detail="A janelinha do sistema quando chega mensagem com o Gravaê atrás de outra coisa. Com a janela na frente ele não aparece — você já está vendo."
          on={prefs.notice}
          onChange={(v) => prefs.set({ notice: v })}
        />

        <Choice data-gc="configuracoes.notifications-section.choice--2"
          title="Contador no título"
          detail={
            bridge
              ? "O número de menções na aba e no ícone do app — o balãozinho do Dock."
              : "O número de menções no título da aba, para achar o Gravaê no meio de vinte abas."
          }
          on={prefs.counter}
          onChange={(v) => prefs.set({ counter: v })}
        />
      </Section>

      <Section data-gc="configuracoes.notifications-section.section--2"
        id="preferencia-de-mencao"
        title="Preferência de menção"
        detail="O que conta como te chamar — e o que passa em silêncio."
      >
        <Choice data-gc="configuracoes.notifications-section.choice--3"
          title="Só quando me chamarem"
          detail="Menção direta, cargo seu, @everyone e conversas privadas. O resto passa em silêncio."
          on={prefs.soMentions}
          onChange={(v) => prefs.set({ soMentions: v })}
        />
      </Section>

      <Section data-gc="configuracoes.notifications-section.section--3"
        id="sounds"
        title="Sons"
        detail="O interruptor de cima cala todos. Abaixo dele, cada um por vez — clique no nome para ouvir."
      >
        <Choice data-gc="configuracoes.notifications-section.choice--4"
          title="Som"
          detail="O aviso do Gravaê para mensagem e duas notas para menção. Não toca no canal que você está lendo."
          on={prefs.sound}
          onChange={(v) => {
            prefs.set({ sound: v });
            if (v) playSound("message");
          }}
        />
        <ListSounds data-gc="configuracoes.notifications-section.list-sounds" />
      </Section>
    </div>
  );
};

const Choice: React.FC<{
  title: string;
  detail: string;
  on: boolean;
  onChange: (value: boolean) => void;
}> = ({ title, detail, on, onChange }) => (
  <div data-gc="configuracoes.notifications-section.div--6" className="mt-4 flex items-start gap-4">
    <div data-gc="configuracoes.notifications-section.div--7" className="min-w-0 flex-1">
      <p data-gc="configuracoes.notifications-section.p--6" className="text-sm font-medium">{title}</p>
      <p data-gc="configuracoes.notifications-section.p--7" className="mt-0.5 text-xs text-ink-faint">{detail}</p>
    </div>
    <Switch data-gc="configuracoes.notifications-section.switch.on-change" checked={on} onCheckedChange={onChange} />
  </div>
);

const ListSounds: React.FC = () => {
  const soundsOff = useNotices((s) => s.soundsOff);
  const setSound = useNotices((s) => s.setSound);
  const soundGeneral = useNotices((s) => s.sound);

  return (
    <div data-gc="configuracoes.notifications-section.div--8" className={soundGeneral ? "" : "pointer-events-none opacity-50"}>
      {SOUNDS_GROUPS.map((group) => (
        <div data-gc="configuracoes.notifications-section.div--9" key={group.title} className="mt-6 first:mt-4">
          <p data-gc="configuracoes.notifications-section.p--8" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {group.title}
          </p>

          <div data-gc="configuracoes.notifications-section.div--10" className="mt-2 overflow-hidden rounded-lg border border-line">
            {group.sounds.map((sound) => {
              const on = !soundsOff[sound.name];

              return (
                <div data-gc="configuracoes.notifications-section.div--11"
                  key={sound.name}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <button data-gc="configuracoes.notifications-section.button--2"
                    type="button"
                    onClick={() => playSound(sound.name)}
                    aria-label={`Ouvir ${sound.label}`}
                    className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-ink-faint transition hover:border-ink-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foco-anel"
                  >
                    <Play data-gc="configuracoes.notifications-section.play" size={12} />
                  </button>

                  <div data-gc="configuracoes.notifications-section.div--12" className="min-w-0 flex-1">
                    <p data-gc="configuracoes.notifications-section.p--9" className="text-sm font-medium">{sound.label}</p>
                    <p data-gc="configuracoes.notifications-section.p--10" className="mt-0.5 text-xs text-ink-faint">
                      {sound.when}
                    </p>
                  </div>

                  <Switch data-gc="configuracoes.notifications-section.switch"
                    checked={on}
                    onCheckedChange={(v) => setSound(sound.name, v)}
                    aria-label={`Tocar ${sound.label}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
