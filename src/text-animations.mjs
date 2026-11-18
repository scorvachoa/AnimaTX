export const animations = [
  ["karaoke", "Resaltar palabra activa"],
  ["pop", "Zoom de entrada"],
  ["reveal", "Palabra a palabra"],
  ["slide", "Entrada escalonada"],
  ["bounce", "Rebote de palabra activa"],
  ["typewriter", "Máquina de escribir"],
  ["slide-up", "Entrar desde abajo"],
  ["slide-down", "Entrar desde arriba"],
  ["slide-left", "Entrar desde la izquierda"],
  ["slide-right", "Entrar desde la derecha"],
  ["float", "Flotar arriba y abajo"],
  ["wave", "Onda por palabra"],
  ["fade", "Aparecer suavemente"],
  ["pulse", "Pulso suave"],
  ["none", "Sin animación"],
];
const clamp = (x) => Math.max(0, Math.min(1, x));
export function lineMotion(animation, elapsed, lineIndex = 0) {
  const progress = clamp(
      (elapsed - (animation === "slide" ? lineIndex * 0.1 : 0)) / 0.3,
    ),
    ease = 1 - Math.pow(1 - progress, 3);
  const result = { opacity: 1, transform: "none" };
  if (animation === "pop")
    result.transform = `scale(${0.8 + 0.2 * clamp(elapsed / 0.12)})`;
  if (
    [
      "slide",
      "slide-up",
      "slide-down",
      "slide-left",
      "slide-right",
      "fade",
    ].includes(animation)
  )
    result.opacity = progress;
  if (animation === "slide" || animation === "slide-up")
    result.transform = `translateY(${(1 - ease) * 35}px)`;
  if (animation === "slide-down")
    result.transform = `translateY(${-(1 - ease) * 35}px)`;
  if (animation === "slide-left")
    result.transform = `translateX(${-(1 - ease) * 50}px)`;
  if (animation === "slide-right")
    result.transform = `translateX(${(1 - ease) * 50}px)`;
  if (animation === "float")
    result.transform = `translateY(${-Math.sin((Math.max(0, elapsed) * Math.PI * 2) / 1.8) * 8}px)`;
  if (animation === "pulse")
    result.transform = `scale(${1 + 0.035 * Math.sin((Math.max(0, elapsed) * Math.PI * 2) / 1.2)})`;
  return result;
}
export function wordMotion(
  animation,
  time,
  word,
  size,
  index = 0,
  blockStart = 0,
) {
  const length = Array.from(word.text).length;
  const progress = clamp(
    (time - word.start) / Math.max(0.001, word.end - word.start),
  );
  const result = {
    opacity: animation === "reveal" && time < word.start ? 0 : 1,
    transform: "none",
    visibleCharacters: length,
  };
  if (animation === "typewriter")
    result.visibleCharacters =
      time >= word.end ? length : Math.floor(length * progress);
  if (animation === "bounce" && time >= word.start && time < word.end)
    result.transform = `translateY(${-Math.sin(clamp((time - word.start) / 0.25) * Math.PI) * size * 0.18}px) scale(1.08)`;
  if (animation === "wave")
    result.transform = `translateY(${-Math.sin(((time - blockStart) * Math.PI * 2) / 1.5 - index * 0.7) * size * 0.09}px)`;
  return result;
}
