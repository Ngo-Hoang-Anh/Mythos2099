type PlayOpts = {
  volume?: number;
  /** Stop / fade after this many ms (long vehicle loops). */
  maxMs?: number;
  loop?: boolean;
};

const MUSIC_VOL = 0.32;
const SFX_VOL = 0.62;

/** Tiny silent wav — play during the unlock gesture so browsers arm HTMLAudio. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

class AudioBus {
  private unlocked = false;
  private muted = false;
  private music: HTMLAudioElement | null = null;
  private playlist: string[] = [];
  private trackIndex = 0;
  private pendingMusic = false;
  private unlockHandler: (() => void) | null = null;

  isUnlocked(): boolean {
    return this.unlocked;
  }

  /**
   * Call once from App. Safe under React Strict Mode remounts:
   * cleanup removes listeners; the next mount rebinds until unlocked.
   */
  bindUnlock(): () => void {
    if (typeof window === "undefined") return () => {};
    if (this.unlocked) return () => {};

    this.teardownUnlock();

    const unlock = () => {
      this.unlock();
      this.teardownUnlock();
    };
    this.unlockHandler = unlock;
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      if (this.unlockHandler === unlock) this.teardownUnlock();
    };
  }

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    this.primeGestureAudio();
    if (this.pendingMusic) this.playCurrentMusic();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.music) this.music.muted = muted;
  }

  playSfx(src: string, opts: PlayOpts = {}): void {
    if (!this.unlocked || this.muted || typeof Audio === "undefined") return;
    const el = new Audio(src);
    el.volume = clamp01(opts.volume ?? SFX_VOL);
    el.loop = Boolean(opts.loop);
    void el.play().catch(() => {});
    if (opts.maxMs && opts.maxMs > 0) {
      window.setTimeout(() => {
        try {
          el.pause();
          el.removeAttribute("src");
          el.load();
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

  private teardownUnlock(): void {
    if (!this.unlockHandler || typeof window === "undefined") {
      this.unlockHandler = null;
      return;
    }
    window.removeEventListener("pointerdown", this.unlockHandler);
    window.removeEventListener("keydown", this.unlockHandler);
    this.unlockHandler = null;
  }

  private primeGestureAudio(): void {
    if (typeof Audio === "undefined") return;
    try {
      const el = new Audio(SILENT_WAV);
      el.volume = 0;
      void el.play().then(() => {
        el.pause();
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }

  private playCurrentMusic(): void {
    if (this.playlist.length === 0 || typeof Audio === "undefined") return;
    const src = this.playlist[this.trackIndex]!;
    if (this.music) {
      this.music.onended = null;
      this.music.pause();
    }
    const el = new Audio(src);
    el.volume = MUSIC_VOL;
    el.muted = this.muted;
    el.onended = () => {
      this.trackIndex = (this.trackIndex + 1) % this.playlist.length;
      this.playCurrentMusic();
    };
    this.music = el;
    void el.play().then(() => {
      this.pendingMusic = false;
    }).catch(() => {
      /* Autoplay still blocked — keep pending for next unlock / gesture. */
      this.pendingMusic = true;
    });
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export const audio = new AudioBus();
