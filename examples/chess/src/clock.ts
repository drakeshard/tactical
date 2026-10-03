import type { Color } from "./chess.js";

export type TimeControl = "3" | "5" | "10" | "unlimited";

export interface ChessClock {
  readonly whiteMs: number | null;
  readonly blackMs: number | null;
}

export function createClock(control: TimeControl): ChessClock {
  if (control === "unlimited") return { whiteMs: null, blackMs: null };

  const milliseconds = Number(control) * 60_000;
  return { whiteMs: milliseconds, blackMs: milliseconds };
}

export function elapseClock(clock: ChessClock, turn: Color, elapsedMs: number): ChessClock {
  if (elapsedMs <= 0) return clock;

  if (turn === "white") {
    if (clock.whiteMs === null) return clock;
    return { ...clock, whiteMs: Math.max(0, clock.whiteMs - elapsedMs) };
  }

  if (clock.blackMs === null) return clock;
  return { ...clock, blackMs: Math.max(0, clock.blackMs - elapsedMs) };
}

export function hasTimedOut(clock: ChessClock, color: Color): boolean {
  return color === "white" ? clock.whiteMs === 0 : clock.blackMs === 0;
}

export function formatClock(milliseconds: number | null): string {
  if (milliseconds === null) return "∞";

  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
