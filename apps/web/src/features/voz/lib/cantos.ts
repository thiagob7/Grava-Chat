
export type Corner = "superior-esquerdo" | "superior-direito" | "inferior-esquerdo" | "inferior-direito";

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Area {
  width: number;
  height: number;
  margin: number;
}

export function nextCornerMore(card: Rectangle, area: Area): Corner {
  const centerX = card.x + card.width / 2;
  const centerY = card.y + card.height / 2;

  const right = centerX >= area.width / 2;
  const down = centerY >= area.height / 2;

  if (down) return right ? "inferior-direito" : "inferior-esquerdo";
  return right ? "superior-direito" : "superior-esquerdo";
}

export function cornerPosition(corner: Corner, card: { width: number; height: number }, area: Area) {
  const left = area.margin;
  const top = area.margin;
  const right = Math.max(area.margin, area.width - card.width - area.margin);
  const down = Math.max(area.margin, area.height - card.height - area.margin);

  switch (corner) {
    case "superior-esquerdo":
      return { x: left, y: top };
    case "superior-direito":
      return { x: right, y: top };
    case "inferior-esquerdo":
      return { x: left, y: down };
    case "inferior-direito":
      return { x: right, y: down };
  }
}

export function fitCorner(card: Rectangle, area: Area) {
  return cornerPosition(nextCornerMore(card, area), card, area);
}
