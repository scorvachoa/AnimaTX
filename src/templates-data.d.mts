import type { Project } from "./Video";
export function impactoStyle(width: number): Project["style"];
export const subtitleTemplates: {
  id: string;
  name: string;
  description: string;
  sample: string[];
  background: string;
  size: number;
  secondSize: number;
  style: Partial<Project["style"]>;
}[];
export function templateStyle(id: string, width: number): Project["style"];
