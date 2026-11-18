import type { Project } from "./Video";
export type History = {
  past: Project[];
  future: Project[];
  group: string;
  at: number;
};
export function recordHistory(
  history: History,
  previous: Project | null,
  next: Project,
  now?: number,
): History;
