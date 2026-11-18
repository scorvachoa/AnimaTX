import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { validateProject } from "./validation.mjs";
export function installTemplateRoutes(app, root) {
  const file = path.join(root, ".local", "templates.json");
  let queue = Promise.resolve();
  async function list() {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") return [];
      throw e;
    }
  }
  async function mutate(fn) {
    const action = queue.then(async () => {
      const items = await list();
      const result = fn(items);
      await fs.mkdir(path.dirname(file), { recursive: true });
      const temp = file + "." + randomUUID() + ".tmp";
      await fs.writeFile(temp, JSON.stringify(items, null, 2));
      await fs.rename(temp, file);
      return result;
    });
    queue = action.catch(() => {});
    return action;
  }
  function name(value) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > 60)
      throw Error("El nombre debe tener entre 1 y 60 caracteres.");
    return value.trim();
  }
  app.get("/api/templates", async (req, res, next) => {
    try {
      res.json(await list());
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/templates", async (req, res, next) => {
    try {
      const entry = {
        id: randomUUID(),
        name: name(req.body.name),
        width: req.body.width,
        style: req.body.style,
      };
      if (
        !Number.isInteger(entry.width) ||
        entry.width < 16 ||
        entry.width > 8192
      )
        throw Error("Ancho de plantilla inválido");
      validateProject({ duration: 1, words: [], style: entry.style });
      res.json(
        await mutate((items) => {
          if (items.length >= 100)
            throw Error("Límite de 100 plantillas personales");
          items.push(entry);
          return entry;
        }),
      );
    } catch (e) {
      next(e);
    }
  });
  app.put("/api/templates/:id", async (req, res, next) => {
    try {
      const label = name(req.body.name);
      res.json(
        await mutate((items) => {
          const t = items.find((t) => t.id === req.params.id);
          if (!t) throw Error("Plantilla no encontrada");
          t.name = label;
          return t;
        }),
      );
    } catch (e) {
      next(e);
    }
  });
  app.delete("/api/templates/:id", async (req, res, next) => {
    try {
      await mutate((items) => {
        const index = items.findIndex((t) => t.id === req.params.id);
        if (index < 0) throw Error("Plantilla no encontrada");
        items.splice(index, 1);
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });
}
