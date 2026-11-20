/** Public SFX / music paths under `/sfx`. */

export const MUSIC_MENU = [
  "/sfx/music/01-abandoned-outpost.ogg",
  "/sfx/music/02-entering-the-void.ogg",
  "/sfx/music/09-ruins-of-tomorrow.ogg",
  "/sfx/music/26-lights-of-megacity.ogg",
  "/sfx/music/rain-softly-abstract-aprils.mp3",
] as const;

export const MUSIC_BATTLE = [
  "/sfx/music/15-collapse-of-the-core.ogg",
  "/sfx/music/19-breach-the-horizon.ogg",
  "/sfx/music/21-breach-of-voidline.ogg",
  "/sfx/music/23-crossing-dead-space.ogg",
  "/sfx/music/14-beneath-alien-skies.ogg",
  "/sfx/music/30-stellar-rift.ogg",
  "/sfx/music/05-beyond-star-gate.ogg",
  "/sfx/music/03-approaching-singularity.ogg",
  "/sfx/music/north-endelos.mp3",
] as const;

export const UI_SELECT = ["/sfx/ui/select-1.ogg", "/sfx/ui/select-2.ogg"] as const;
export const UI_CANCEL = ["/sfx/ui/cancel-1.ogg", "/sfx/ui/cancel-2.ogg"] as const;
export const UI_CURSOR = [
  "/sfx/ui/cursor-1.ogg",
  "/sfx/ui/cursor-2.ogg",
  "/sfx/ui/cursor-3.ogg",
  "/sfx/ui/cursor-4.ogg",
] as const;
export const UI_ERROR = ["/sfx/ui/error-1.ogg", "/sfx/ui/error-2.ogg"] as const;
export const UI_POPUP_OPEN = ["/sfx/ui/popup-open-1.ogg"] as const;
export const UI_POPUP_CLOSE = ["/sfx/ui/popup-close-1.ogg"] as const;
export const UI_CONFIRM = [
  "/sfx/ui/modern-ui-16.wav",
  "/sfx/ui/modern-ui-17.wav",
  "/sfx/ui/text-message-1.wav",
  "/sfx/ui/text-message-5.wav",
] as const;
export const UI_SWIPE = ["/sfx/ui/swipe-1.ogg", "/sfx/ui/swipe-2.ogg"] as const;

export const GUN_FIRE = [
  "/sfx/weapons/gun/gun-blast-1.wav",
  "/sfx/weapons/gun/gun-blast-2.wav",
  "/sfx/weapons/gun/gun-blast-3.wav",
  "/sfx/weapons/gun/gun-blast-4.wav",
  "/sfx/weapons/gun/heavy-machine-gun-1.wav",
  "/sfx/weapons/gun/heavy-machine-gun-2.wav",
  "/sfx/weapons/gun/heavy-machine-gun-3.wav",
  "/sfx/weapons/gun/heavy-machine-gun-4.wav",
  "/sfx/weapons/gun/resistance-blaster-1.wav",
  "/sfx/weapons/gun/resistance-blaster-2.wav",
  "/sfx/weapons/gun/resistance-blaster-3.wav",
  "/sfx/weapons/gun/resistance-blaster-4.wav",
] as const;

export const ARTILLERY_FIRE = [
  "/sfx/weapons/artillery/cannon-fire.wav",
  "/sfx/weapons/artillery/heavy-artillery-shot.wav",
  "/sfx/weapons/artillery/artillery-gunfire.flac",
  "/sfx/weapons/artillery/artillery-fire.mp3",
  "/sfx/weapons/artillery/artillery-barrage.wav",
] as const;

export const IMPACT = [
  "/sfx/explosions/blast.ogg",
  "/sfx/explosions/incoming-artillery-strike.wav",
  "/sfx/weapons/gun/gun-blast-1.wav",
  "/sfx/weapons/gun/gun-blast-3.wav",
  "/sfx/weapons/artillery/heavy-artillery-shot.wav",
] as const;

export const DESTROY = [
  "/sfx/explosions/incoming-artillery-strike.wav",
  "/sfx/explosions/blast.ogg",
  "/sfx/weapons/artillery/artillery-barrage.wav",
  "/sfx/alarms/collision-imminent.wav",
] as const;

export const MOVE_GROUND = [
  "/sfx/vehicles/tank/tank-engine-moving.wav",
  "/sfx/vehicles/tank/tracks-gravel-movement.flac",
  "/sfx/vehicles/tank/mech-step.wav",
] as const;

export const MOVE_MECH = [
  "/sfx/vehicles/tank/mech-step.wav",
  "/sfx/robot/glitchy-robotics-1.wav",
  "/sfx/robot/glitchy-robotics-3.wav",
  "/sfx/robot/glitchy-robotics-5.wav",
  "/sfx/robot/glitchy-robotics-7.wav",
] as const;

export const MOVE_HELI = ["/sfx/vehicles/aircraft/helicopter-loop-30s.wav"] as const;
export const MOVE_JET = ["/sfx/vehicles/aircraft/jet-noise.mp3"] as const;

export const ALARM_SOFT = [
  "/sfx/alarms/cockpit-alert.wav",
  "/sfx/alarms/communicator-ring-urgent.wav",
  "/sfx/radio/map-screen-radio-voice.mp3",
] as const;

/** Stable pick: same slot always maps to the same entry. */
export function pickSlot<T>(pool: readonly T[], slot: number): T {
  if (pool.length === 0) throw new Error("empty sound pool");
  const i = ((slot % pool.length) + pool.length) % pool.length;
  return pool[i]!;
}
