export async function listGeminiModels({ apiKey, fetchImpl = fetch }) {
  if (typeof apiKey !== "string" || !apiKey.trim())
    throw Error("Configura o introduce una clave para cargar los modelos.");
  const models = new Map();
  let token = "";
  const seen = new Set();
  const signal = AbortSignal.timeout(20000);
  for (let page = 0; page < 10; page++) {
    const url = new URL(
      "https://generativelanguage.googleapis.com/v1beta/models",
    );
    url.searchParams.set("pageSize", "1000");
    if (token) url.searchParams.set("pageToken", token);
    let response;
    try {
      response = await fetchImpl(url.toString(), {
        headers: { "x-goog-api-key": apiKey.trim() },
        signal,
      });
    } catch {
      throw Error("No se pudo conectar con Google para cargar los modelos.");
    }
    if (!response.ok)
      throw Error(
        response.status === 429
          ? "No se pudieron cargar modelos: cuota o límite de solicitudes."
          : response.status === 400 ||
              response.status === 401 ||
              response.status === 403
            ? "Google rechazó la clave o sus permisos para listar modelos."
            : "No se pudieron cargar los modelos de Gemini.",
      );
    let data;
    try {
      data = await response.json();
    } catch {
      throw Error("La lista de modelos recibida no es válida.");
    }
    if (!Array.isArray(data.models))
      throw Error("La lista de modelos recibida no es válida.");
    for (const model of data.models) {
      const id =
        typeof model.name === "string"
          ? model.name.replace(/^models\//, "")
          : "";
      if (
        !/^gemini-[a-zA-Z0-9.-]{1,100}$/.test(id) ||
        !model.supportedGenerationMethods?.includes("generateContent") ||
        /image|audio|tts|robotics|embedding|computer-use/i.test(id)
      )
        continue;
      models.set(id, {
        id,
        name:
          typeof model.displayName === "string"
            ? model.displayName.slice(0, 128)
            : id,
      });
    }
    if (!data.nextPageToken)
      return [...models.values()].sort((a, b) => a.name.localeCompare(b.name));
    if (
      typeof data.nextPageToken !== "string" ||
      data.nextPageToken.length > 4096 ||
      seen.has(data.nextPageToken)
    )
      throw Error("La paginación de modelos recibida no es válida.");
    token = data.nextPageToken;
    seen.add(token);
  }
  throw Error("La lista de modelos es demasiado extensa. Inténtalo de nuevo.");
}
