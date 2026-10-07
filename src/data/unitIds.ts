/**
 * Catalog unit ids as integers 1…27. Tutorial units: 101…103.
 * 0 is reserved for fog-of-war / placeholder (not a real unit).
 */
export const HIDDEN_UNIT_ID = 0;

export const U01 = 1;
export const U02 = 2;
export const U03 = 3;
export const U04 = 4;
export const U05 = 5;
export const U06 = 6;
export const U07 = 7;
export const U08 = 8;
export const U09 = 9;
export const U10 = 10;
export const U11 = 11;
export const U12 = 12;
export const U13 = 13;
export const U14 = 14;
export const U15 = 15;
export const U16 = 16;
export const U17 = 17;
export const U18 = 18;
export const U19 = 19;
export const U20 = 20;
export const U21 = 21;
export const U22 = 22;
export const U23 = 23;
export const U24 = 24;
export const U25 = 25;
export const U26 = 26;
export const U27 = 27;

export const T01 = 101;
export const T02 = 102;
export const T03 = 103;

export type CatalogUnitId =
  | typeof U01
  | typeof U02
  | typeof U03
  | typeof U04
  | typeof U05
  | typeof U06
  | typeof U07
  | typeof U08
  | typeof U09
  | typeof U10
  | typeof U11
  | typeof U12
  | typeof U13
  | typeof U14
  | typeof U15
  | typeof U16
  | typeof U17
  | typeof U18
  | typeof U19
  | typeof U20
  | typeof U21
  | typeof U22
  | typeof U23
  | typeof U24
  | typeof U25
  | typeof U26
  | typeof U27;

export type TutorialUnitId = typeof T01 | typeof T02 | typeof T03;
export type UnitId = CatalogUnitId | TutorialUnitId;
