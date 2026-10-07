import { ARMY_SIZE, type CardInstance, type UnitDef } from "./types";
import { getUnitDef } from "../data/units";

export function deckCardsOf(def: UnitDef): UnitDef["cards"] {
  return def.cards;
}

export function validateArmy(unitIds: number[]): string | null {
  if (unitIds.length !== ARMY_SIZE) return `Army must contain exactly ${ARMY_SIZE} units`;
  const unique = new Set(unitIds);
  if (unique.size !== unitIds.length) return "Army cannot contain duplicate units";
  for (const id of unitIds) {
    try {
      getUnitDef(id);
    } catch {
      return `Unknown unit: ${id}`;
    }
  }
  return null;
}

export function buildDeck(unitIds: number[], nextId: () => string): CardInstance[] {
  const cards: CardInstance[] = [];
  for (const unitId of unitIds) {
    const def = getUnitDef(unitId);
    for (const template of deckCardsOf(def)) {
      cards.push({
        instanceId: nextId(),
        ownerUnitId: unitId,
        templateId: template.templateId,
        name: template.name,
        type: template.type,
        cost: template.cost,
        text: template.text,
        effectId: template.effectId,
        targets: [...template.targets],
        requiresSourceOnField: template.requiresSourceOnField,
      });
    }
  }
  return cards;
}

export function armyDefs(unitIds: number[]): UnitDef[] {
  return unitIds.map(getUnitDef);
}

export function deckSizeForArmy(unitIds: number[]): number {
  return unitIds.reduce((sum, id) => sum + deckCardsOf(getUnitDef(id)).length, 0);
}
