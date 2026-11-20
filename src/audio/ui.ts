import {
  ALARM_SOFT,
  MUSIC_BATTLE,
  MUSIC_MENU,
  UI_CANCEL,
  UI_CONFIRM,
  UI_CURSOR,
  UI_ERROR,
  UI_POPUP_CLOSE,
  UI_POPUP_OPEN,
  UI_SELECT,
  UI_SWIPE,
  pickSlot,
} from "./catalog";
import { audio } from "./player";

export type UiSound =
  | "select"
  | "cancel"
  | "cursor"
  | "error"
  | "popupOpen"
  | "popupClose"
  | "confirm"
  | "swipe"
  | "alarm";

const UI_POOLS: Record<UiSound, readonly string[]> = {
  select: UI_SELECT,
  cancel: UI_CANCEL,
  cursor: UI_CURSOR,
  error: UI_ERROR,
  popupOpen: UI_POPUP_OPEN,
  popupClose: UI_POPUP_CLOSE,
  confirm: UI_CONFIRM,
  swipe: UI_SWIPE,
  alarm: ALARM_SOFT,
};

/** Rotating UI picks so repeated clicks are not identical. */
let uiTick = 0;

export function playUi(kind: UiSound, volume = 0.5): void {
  const pool = UI_POOLS[kind];
  const src = pickSlot(pool, uiTick++);
  audio.playSfx(src, { volume, maxMs: kind === "alarm" ? 1800 : 900 });
}

export function startMenuMusic(): void {
  const start = Math.floor(Math.random() * MUSIC_MENU.length);
  audio.setMusic(MUSIC_MENU, start);
}

export function startBattleMusic(): void {
  const start = Math.floor(Math.random() * MUSIC_BATTLE.length);
  audio.setMusic(MUSIC_BATTLE, start);
}
