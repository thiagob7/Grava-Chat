import { randomInt } from "node:crypto";

import { GIFT_CODE_SIZE } from "@gravae/shared";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const newGiftCode = () =>
  Array.from({ length: GIFT_CODE_SIZE }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
