import { ICON_NAMES } from "../constants";

export { ICON_NAMES };

export type IconName = (typeof ICON_NAMES)[number];

export function isIconName(value: string): value is IconName {
  return (ICON_NAMES as readonly string[]).includes(value);
}
