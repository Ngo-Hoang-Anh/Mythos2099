import { HIDDEN_UNIT_ID } from "./unitIds";
import { INITIATIVE_TEMPLATE_ID, type CardInstance } from "../engine/types";

/** Display name of the second-player compensation card. */
export const INITIATIVE_CARD_NAME = "Fully Prepared";

export function makeInitiativeCard(instanceId: string): CardInstance {
  return {
    instanceId,
    ownerUnitId: HIDDEN_UNIT_ID,
    templateId: INITIATIVE_TEMPLATE_ID,
    name: INITIATIVE_CARD_NAME,
    type: "special",
    cost: 0,
    text: "Choose 1: move 1 allied unit 1 space in any direction (including diagonal), gain 1 Supply, or gain +1 Supply at the start of your next Deployment.",
    effectId: "initiative",
    targets: [],
  };
}

export function isInitiativeCard(card: Pick<CardInstance, "templateId" | "effectId">): boolean {
  return card.templateId === INITIATIVE_TEMPLATE_ID || card.effectId === "initiative";
}
