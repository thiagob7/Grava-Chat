import React from "react";
import { Flag, Hand, Hash, Leaf, Lightbulb, Pizza, Plane, Smile, Trophy } from "lucide-react";

export const GROUP_ICONS: Record<string, React.ReactNode> = {
  smileys_emotion: <Smile data-gc="expressao.icones-de-grupo.smile" size={18} />,
  people_body: <Hand data-gc="expressao.icones-de-grupo.hand" size={18} />,
  animals_nature: <Leaf data-gc="expressao.icones-de-grupo.leaf" size={18} />,
  food_drink: <Pizza data-gc="expressao.icones-de-grupo.pizza" size={18} />,
  travel_places: <Plane data-gc="expressao.icones-de-grupo.plane" size={18} />,
  activities: <Trophy data-gc="expressao.icones-de-grupo.trophy" size={18} />,
  objects: <Lightbulb data-gc="expressao.icones-de-grupo.lightbulb" size={18} />,
  symbols: <Hash data-gc="expressao.icones-de-grupo.hash" size={18} />,
  flags: <Flag data-gc="expressao.icones-de-grupo.flag" size={18} />,
};
