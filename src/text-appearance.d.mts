import type { Project } from "./Video";
export type LineAppearance = {
  outlineEnabled: boolean;
  shadowEnabled: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textCase: "original" | "upper" | "lower" | "capitalize";
  outlineOpacity: number;
  outlineSize: number;
  shadowColor: string;
  shadowOpacity: number;
  shadowSize: number;
};
export function lineAppearance(
  style: Partial<Project["style"]>,
  second?: boolean,
): LineAppearance;
export function secondAppearanceDefaults(
  style: Project["style"],
): Partial<Project["style"]>;
export function alphaColor(hex: string, opacity: number): string;
export function caseCharacters(
  characters: { letter: string; index: number }[],
  mode: string,
  firstLetter?: boolean,
): { letter: string; index: number }[];
export function validateTextAppearance(style: unknown): void;
