import type { LessonHint } from "./lessons";

export const BUILD_GUIDE_ID = "build-army" as const;

export const BUILD_GUIDE = {
  id: BUILD_GUIDE_ID,
  number: 16,
  title: "Build an army",
  subtitle: "8 units. Their cards are the deck.",
  success: "8 unique units. Each one brings 1 Special, 1 Maneuver, and 1 Move into the deck.",
};

export const BUILD_GUIDE_STEPS: readonly LessonHint[] = [
  {
    id: "count",
    anchor: "builder-catalog",
    title: "Pick 8 unique units",
    body: "An army is exactly 8 different units — no duplicates. Press Select beside a portrait to add or remove it. The counter on the right must read 8/8.",
    next: true,
  },
  {
    id: "unit",
    anchor: "builder-unit",
    title: "Read the token",
    body: "Click the portrait — not Select — to put that unit on the detail screen. Supply, HP, Armor, ATK, AP, keywords, and cards show there.",
    next: true,
  },
  {
    id: "cards",
    anchor: "builder-cards",
    title: "Units are the deck",
    body: "Every unit adds one Special, one Maneuver, and one Move. Open Decklist to see those cards. They are shuffled into your deck automatically.",
    next: true,
  },
  {
    id: "premade",
    anchor: "builder-premade",
    title: "Premade lists",
    body: "Start from a themed 8-unit list, then swap units in and out. Tank + Robot, Retaliate, Support Fire, Jets + Infantry, and Aggro are shortcuts — not locked loadouts.",
    next: true,
  },
  {
    id: "deck",
    anchor: "builder-deck",
    title: "Deck panel",
    body: "The right column keeps average stats visible. Decklist lifts the unit list into the screen. Click a unit there to remove it.",
    next: true,
  },
  {
    id: "start",
    anchor: "builder-start",
    title: "When 8/8 is ready",
    body: "If the footer shows no error, you can start a match. This walkthrough does not launch one — press Finish when the panel makes sense.",
    next: true,
    nextLabel: "Finish",
  },
];
