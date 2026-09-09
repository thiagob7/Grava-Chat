export interface WindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MIN_SIZE = { width: 420, height: 300 };
const MARGIN = 8;

type ScreenSize = { width: number; height: number };

const screenSize = (screen?: ScreenSize): ScreenSize =>
  screen ?? {
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    height: typeof window === "undefined" ? 800 : window.innerHeight,
  };

export function fitOnScreen(wanted: WindowGeometry, screen?: ScreenSize): WindowGeometry {
  const { width: screenWidth, height: screenHeight } = screenSize(screen);

  const width = Math.min(Math.max(MIN_SIZE.width, wanted.width), screenWidth - MARGIN * 2);
  const height = Math.min(Math.max(MIN_SIZE.height, wanted.height), screenHeight - MARGIN * 2);

  return {
    width,
    height,
    x: Math.min(Math.max(MARGIN, wanted.x), Math.max(MARGIN, screenWidth - width - MARGIN)),
    y: Math.min(Math.max(MARGIN, wanted.y), Math.max(MARGIN, screenHeight - height - MARGIN)),
  };
}

const storageKey = (id: string) => `gravae:janela:${id}`;

export function defaultGeometry(screen?: ScreenSize): WindowGeometry {
  const { width: screenWidth, height: screenHeight } = screenSize(screen);

  const width = Math.min(1180, Math.round(screenWidth * 0.78));
  const height = Math.min(820, Math.round(screenHeight * 0.82));

  return fitOnScreen({
    width,
    height,
    x: Math.round((screenWidth - width) / 2),
    y: Math.round((screenHeight - height) / 2),
  });
}

export function storedGeometry(id: string): WindowGeometry {
  try {
    const saved = localStorage.getItem(storageKey(id));
    if (!saved) return defaultGeometry();

    const parsed = JSON.parse(saved) as Partial<WindowGeometry>;

    if (![parsed.x, parsed.y, parsed.width, parsed.height].every((n) => typeof n === "number")) {
      return defaultGeometry();
    }

    return fitOnScreen(parsed as WindowGeometry);
  } catch {
    return defaultGeometry();
  }
}

export function storeGeometry(id: string, geometry: WindowGeometry) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(geometry));
  } catch {
    return;
  }
}
