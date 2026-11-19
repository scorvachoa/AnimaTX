export async function readApiResponse(response) {
  const type = response.headers.get("content-type") || "";
  if (!type.toLowerCase().includes("application/json")) {
    throw Error(
      "El servidor no reconoce esta operación o está desactualizado. Reinicia AnimaTX y vuelve a intentarlo.",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error(
      "La respuesta del servidor no es válida. Reinicia AnimaTX y vuelve a intentarlo.",
    );
  }
  if (!response.ok)
    throw Error(data?.error || `Error del servidor (${response.status}).`);
  return data;
}
