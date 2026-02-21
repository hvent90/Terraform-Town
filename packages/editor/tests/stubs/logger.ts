export type Level = "D" | "I" | "W" | "E";
export function log(_level: Level, _run: string, _phase: string, _detail?: string): void {}
export function resetForTesting(): void {}
