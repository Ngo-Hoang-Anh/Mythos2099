type PlayOpts = {
  volume?: number;
  /** Stop / fade after this many ms (long vehicle loops). */
  maxMs?: number;
  loop?: boolean;
};

const MUSIC_VOL = 0.32;
const SFX_VOL = 0.62;

class AudioBus {
  private unlocked = false;
  private muted = false;
  private music: HTMLAudioElement | null = null;
  private playlist: string[] = [];
  private trackIndex = 0;
  private unlockBound = false;
  private pendingMusic = false;

  isUnlocked(): boolean {
    return this.unlocked;
  }

  /** Call once from App — first pointer/key unlocks Web Audio autoplay. */
  bindUnlock(): () => void {
    if (this.unlockBound || typeof window === "undefined") return () => {};
    this.unlockBound = true;
    const unlock = () => {
      this.unlock();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.pendingMusic) this.playCurrentMusic();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.music) this.music.muted = muted;
  }

  playSfx(src: string, opts: PlayOpts = {}): void {
    if (!this.unlocked || this.muted || typeof Audio === "undefined") return;
    const audio = new Audio(src);
    audio.volume = clamp01(opts.volume ?? SFX_VOL);
    audio.loop = Boolean(opts.loop);
    void audio.play().catch(() => {});
    if (opts.maxMs && opts.maxMs > 0) {
      window.setTimeout(() => {
        try {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
        } catch {
          /* ignore */
        }
      }, opts.maxMs);
    }
  }

  /** Replace BGM playlist and start the first track (loops through list). */
  setMusic(tracks: readonly string[], startIndex = 0): void {
    this.playlist = [...tracks];
    this.trackIndex = tracks.length === 0 ? 0 : ((startIndex % tracks.length) + tracks.length) % tracks.length;
    this.pendingMusic = true;
    if (this.unlocked) this.playCurrentMusic();
  }

  stopMusic(): void {
    this.pendingMusic = false;
    if (!this.music) return;
    this.music.onended = null;
    this.music.pause();
    this.music = null;
  }

  private playCurrentMusic(): void {
    if (this.playlist.length === 0 || typeof Audio === "undefined") return;
    const src = this.playlist[this.trackIndex]!;
    if (this.music) {
      this.music.onended = null;
      this.music.pause();
    }
    const audio = new Audio(src);
    audio.volume = MUSIC_VOL;
    audio.muted = this.muted;
    audio.onended = () => {
      this.trackIndex = (this.trackIndex + 1) % this.playlist.length;
      this.playCurrentMusic();
    };
    this.music = audio;
    void audio.play().catch(() => {
      /* wait for unlock */
    });
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export const audio = new AudioBus();
