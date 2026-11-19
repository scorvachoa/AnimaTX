import fs from "node:fs/promises";
import path from "node:path";
export async function deleteProjectFiles(dataRoot, id) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)
  )
    throw Error("Proyecto inválido");
  const root = await fs.realpath(dataRoot);
  const target = path.resolve(root, id);
  if (path.dirname(target) !== root) throw Error("Ruta de proyecto inválida");
  const info = await fs.lstat(target);
  if (!info.isDirectory() || info.isSymbolicLink())
    throw Error("Carpeta de proyecto inválida");
  // Only remove a direct project directory under the verified data root.
  await fs.rm(target, { recursive: true, force: false });
}
