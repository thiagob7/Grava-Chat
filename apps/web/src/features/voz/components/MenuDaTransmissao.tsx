import React from "react";
import { CircleStop, Lock, MonitorPlay, MonitorUp, Settings } from "lucide-react";

import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~/components/ui/dropdown-menu";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import {
  SCREEN_FRAME_RATES,
  SCREEN_RESOLUTIONS,
  isScreenFrameRateLocked,
  isScreenResolutionLocked,
  screenQuality,
  type ScreenFrameRate,
  type ScreenResolution,
} from "~/features/voz/lib/qualidade-da-transmissao";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { useTranslation } from "~/traducao";

export const ScreenShareMenuItems: React.FC<{ withSettings?: boolean }> = ({ withSettings = false }) => {
  const { t } = useTranslation();
  const openSettings = useSettings((s) => s.open);

  const screenEnabled = useVoiceStore((s) => s.screenEnabled);
  const toggleScreen = useVoiceStore((s) => s.toggleScreen);
  const swapScreen = useVoiceStore((s) => s.swapScreen);
  const setScreenSound = useVoiceStore((s) => s.setScreenSound);
  const setScreenQuality = useVoiceStore((s) => s.setScreenQuality);

  const screenSound = useVoicePrefs((s) => s.screenSound);
  const screenResolution = useVoicePrefs((s) => s.screenResolution);
  const screenFrameRate = useVoicePrefs((s) => s.screenFrameRate);
  const quality = screenQuality(screenResolution, screenFrameRate);

  return (
    <>
      {screenEnabled ? (
        <>
          <DropdownMenuItem data-gc="voz.menu-da-transmissao.dropdown-menu-item" danger onSelect={() => void toggleScreen()}>
            {t("chamada.tela.pararTransmissao")} <CircleStop data-gc="voz.menu-da-transmissao.circle-stop" size={15} />
          </DropdownMenuItem>

          <DropdownMenuItem data-gc="voz.menu-da-transmissao.dropdown-menu-item--2" onSelect={() => void swapScreen()}>
            {t("chamada.tela.alterarTransmissao")} <MonitorPlay data-gc="voz.menu-da-transmissao.monitor-play" size={15} />
          </DropdownMenuItem>
        </>
      ) : (
        <DropdownMenuItem data-gc="voz.menu-da-transmissao.dropdown-menu-item--3" onSelect={() => void toggleScreen()}>
          {t("chamada.tela.compartilhar")} <MonitorUp data-gc="voz.menu-da-transmissao.monitor-up" size={15} />
        </DropdownMenuItem>
      )}

      <DropdownMenuSub data-gc="voz.menu-da-transmissao.dropdown-menu-sub">
        <DropdownMenuSubTrigger data-gc="voz.menu-da-transmissao.dropdown-menu-sub-trigger">{t("chamada.tela.qualidade")}</DropdownMenuSubTrigger>

        <DropdownMenuSubContent data-gc="voz.menu-da-transmissao.dropdown-menu-sub-content" sideOffset={8} className="w-52">
          <DropdownMenuLabel data-gc="voz.menu-da-transmissao.dropdown-menu-label">{t("chamada.tela.taxaDeQuadros")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup data-gc="voz.menu-da-transmissao.dropdown-menu-radio-group"
            value={String(quality.frameRate)}
            onValueChange={(value) => void setScreenQuality({ screenFrameRate: Number(value) as ScreenFrameRate })}
          >
            {SCREEN_FRAME_RATES.map((fps) => (
              <DropdownMenuRadioItem data-gc="voz.menu-da-transmissao.dropdown-menu-radio-item" key={fps} value={String(fps)} disabled={isScreenFrameRateLocked(fps)} onSelect={(e) => e.preventDefault()}>
                <span data-gc="voz.menu-da-transmissao.span" className="flex w-full items-center justify-between gap-2">
                  {t("chamada.tela.quadros", { quadros: fps })}
                  {isScreenFrameRateLocked(fps) && <Lock data-gc="voz.menu-da-transmissao.lock" size={13} className="shrink-0 text-ink-faint" />}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator data-gc="voz.menu-da-transmissao.dropdown-menu-separator" />

          <DropdownMenuLabel data-gc="voz.menu-da-transmissao.dropdown-menu-label--2">{t("chamada.tela.resolucao")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup data-gc="voz.menu-da-transmissao.dropdown-menu-radio-group--2"
            value={quality.resolution}
            onValueChange={(value) => void setScreenQuality({ screenResolution: value as ScreenResolution })}
          >
            {SCREEN_RESOLUTIONS.map((resolution) => (
              <DropdownMenuRadioItem data-gc="voz.menu-da-transmissao.dropdown-menu-radio-item--2" key={resolution} value={resolution} disabled={isScreenResolutionLocked(resolution)} onSelect={(e) => e.preventDefault()}>
                <span data-gc="voz.menu-da-transmissao.span--2" className="flex w-full items-center justify-between gap-2">
                  {resolution === "original" ? t("chamada.tela.original") : `${resolution}p`}
                  {isScreenResolutionLocked(resolution) && <Lock data-gc="voz.menu-da-transmissao.lock--2" size={13} className="shrink-0 text-ink-faint" />}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuCheckboxItem data-gc="voz.menu-da-transmissao.dropdown-menu-checkbox-item"
        checked={screenSound}
        onCheckedChange={(marked) => void setScreenSound(marked)}
        onSelect={(e) => e.preventDefault()}
      >
        {t("chamada.tela.compartilharAudio")}
      </DropdownMenuCheckboxItem>

      {withSettings && (
        <>
          <DropdownMenuSeparator data-gc="voz.menu-da-transmissao.dropdown-menu-separator--2" />
          <DropdownMenuItem data-gc="voz.menu-da-transmissao.dropdown-menu-item--4" onSelect={() => openSettings("voice")}>
            {t("chamada.tela.configCompartilhamento")} <Settings data-gc="voz.menu-da-transmissao.settings" size={15} />
          </DropdownMenuItem>
        </>
      )}
    </>
  );
};
