import { Hash, Mic, Monitor, ChevronDown, Plus, Smile } from "lucide-react";

const CHANNELS = ["avisos", "geral", "jogatina", "musica"];

const CHAT = [
  { name: "Bia", color: "#e0568a", text: "gente, tô subindo o servidor de voz agora" },
  { name: "Léo", color: "#4f8cf0", text: "opa, entra lá que eu tô esperando" },
  { name: "Bia", color: "#e0568a", text: "cheguei! tá ouvindo?" },
  { name: "Thi", color: "#d30404", text: "ouvindo demais, teu microfone tá ótimo 🎧" },
];

const MEMBERS = [
  { name: "Bia", color: "#e0568a", state: "online" },
  { name: "Léo", color: "#4f8cf0", state: "online" },
  { name: "Thi", color: "#d30404", state: "online" },
  { name: "Duda", color: "#f0a63c", state: "ausente" },
];

const STEP_S = 0.45;
const START_S = 0.35;

const Dot = ({ color, letter }: { color: string; letter: string }) => (
  <span
    className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
    style={{ backgroundColor: color }}
  >
    {letter}
  </span>
);

export const AppStage = () => (
  <div className="palco-do-app mx-auto mt-14 w-full max-w-5xl px-2 sm:px-0">
    <div className="janela-do-palco overflow-hidden rounded-xl border border-line bg-surface-1 shadow-2xl shadow-black/60">
      <div className="flex h-8 items-center gap-1.5 border-b border-line bg-surface-0 px-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[10px] font-medium text-ink-faint">Gravaê</span>
      </div>

      <div className="flex h-[22rem] text-left sm:h-[26rem]">
        <div className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-line bg-surface-1 py-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-sm font-black text-white">
            G
          </span>
          <span className="h-px w-6 rounded bg-surface-3" />
          {["#4f8cf0", "#e0568a", "#f0a63c"].map((color, i) => (
            <span
              key={color}
              className="surge size-9 rounded-2xl opacity-80"
              style={{ backgroundColor: color, animationDelay: `${START_S + i * 0.1}s` }}
            />
          ))}
          <span className="flex size-9 items-center justify-center rounded-2xl bg-surface-0 text-ink-faint">
            <Plus size={16} />
          </span>
        </div>

        <div className="hidden w-44 shrink-0 flex-col border-r border-line bg-surface-1 sm:flex">
          <div className="flex h-11 items-center gap-1 border-b border-line px-3 text-sm font-semibold">
            A firma <ChevronDown size={14} className="text-ink-muted" />
          </div>

          <div className="flex-1 space-y-0.5 p-2">
            <p className="px-1 py-1.5 text-sm font-semibold leading-5 text-ink-faint">Canais de texto</p>

            {CHANNELS.map((channel, i) => (
              <div
                key={channel}
                className={`surge flex items-center gap-1.5 rounded-md px-2 py-1.5 text-base font-medium leading-5 ${
                  channel === "geral" ? "bg-white/10 text-ink" : "text-ink-faint"
                }`}
                style={{ animationDelay: `${START_S + i * 0.08}s` }}
              >
                <Hash size={20} className="shrink-0" />
                <span className="truncate">{channel}</span>
              </div>
            ))}

            <p className="px-1 pb-1 pt-3 text-sm font-semibold leading-5 text-ink-faint">Canais de voz</p>

            <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-base font-medium leading-5 text-ink-faint">
              <Mic size={20} className="shrink-0" />
              <span className="truncate">Mesa</span>
            </div>

            <div className="space-y-1 pl-6 pt-1">
              {MEMBERS.slice(0, 2).map(({ name, color }, i) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="relative flex">
                    <Dot color={color} letter={name[0]!} />
                    {i === 0 && (
                      <span className="anel-de-fala absolute inset-0 rounded-full ring-2 ring-online" />
                    )}
                  </span>
                  <span className="truncate text-sm font-medium text-ink-muted">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col bg-surface-2">
          <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-4">
            <Hash size={18} className="text-ink-faint" />
            <span className="text-sm font-semibold">geral</span>
            <span className="ml-auto flex items-center gap-1 rounded-full bg-online/15 px-2 py-0.5 text-[10px] font-semibold text-online">
              <Monitor size={11} /> Léo está transmitindo
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-hidden p-4">
            {CHAT.map(({ name, color, text }, i) => (
              <div
                key={text}
                className={`surge gap-2.5 ${i === 0 ? "hidden sm:flex" : "flex"}`}
                style={{ animationDelay: `${START_S + i * STEP_S}s` }}
              >
                <Dot color={color} letter={name[0]!} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: color }}>
                    {name}
                  </p>
                  <p className="text-sm leading-relaxed text-ink-muted">{text}</p>
                  {i === CHAT.length - 1 && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-line bg-surface-3 px-1.5 py-0.5 text-[11px]">
                      🔥 <span className="font-semibold text-ink-muted">3</span>
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div
              className="surge flex items-center gap-2 pt-1"
              style={{ animationDelay: `${START_S + CHAT.length * STEP_S}s` }}
            >
              <span className="flex -space-x-1.5">
                {MEMBERS.slice(0, 2).map(({ name, color }) => (
                  <span key={name} className="ring-2 ring-surface-2">
                    <Dot color={color} letter={name[0]!} />
                  </span>
                ))}
              </span>
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="ponto-digitando size-1.5 rounded-full bg-ink-faint"
                    style={{ animationDelay: `${i * 0.16}s` }}
                  />
                ))}
              </span>
              <span className="text-xs text-ink-faint">Bia e Léo estão digitando…</span>
            </div>
          </div>

          <div className="shrink-0 px-4 pb-4">
            <div className="flex items-center gap-2 rounded-lg bg-surface-3 px-3 py-2.5">
              <Plus size={16} className="shrink-0 text-ink-faint" />
              <span className="flex-1 text-sm text-ink-faint">
                Conversar em #geral
                <span className="cursor-do-campo ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-ink" />
              </span>
              <Smile size={16} className="shrink-0 text-ink-faint" />
            </div>
          </div>
        </div>

        <div className="hidden w-40 shrink-0 flex-col gap-1 border-l border-line bg-surface-1 p-3 lg:flex">
          <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Na sala — 4
          </p>
          {MEMBERS.map(({ name, color, state }, i) => (
            <div
              key={name}
              className="surge flex items-center gap-2 rounded-md px-1 py-1"
              style={{ animationDelay: `${START_S + i * 0.1}s` }}
            >
              <span className="relative">
                <Dot color={color} letter={name[0]!} />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-surface-1 ${
                    state === "online" ? "bg-online" : "bg-[#f0a63c]"
                  }`}
                />
              </span>
              <span className="truncate text-sm font-medium text-ink-muted">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
