import type { Project } from "./Video";
export type CustomTemplate = {
  id: string;
  name: string;
  width: number;
  style: Project["style"];
};
export function scaleTemplateStyle(
  template: CustomTemplate,
  width: number,
): Project["style"];
