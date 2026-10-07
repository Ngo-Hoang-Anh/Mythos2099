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
    body: "An army is exactly 8 different units — no duplicates. Click a portrait to add or remove it. The counter on the right must read 8/8.",
    next: true,
  },
  {
    id: "unit",
    anchor: "builder-unit",
    title: "Read the token",
    body: "Supply, HP, Armor, ATK, and AP sit on the portrait. Keyword icons sit under the name. Hover a keyword for the short rule — that is the same icon you will see in a match.",
    next: true,
  },
  {
    id: "cards",
    anchor: "builder-cards",
    title: "Units are the deck",
    body: "Every unit adds one Special, one Maneuver, and one Move. Those 24 cards are shuffled into your deck automatically. Hover a card name to read it. You do not pick cards one by one.",
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
    body: "The right column totals your 8 units, average stats, keywords, and every card that will be in the match. Click a unit here to remove it.",
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
