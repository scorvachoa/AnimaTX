export function scaleTemplateStyle(template, width) {
  const ratio = width / template.width,
    style = structuredClone(template.style);
  for (const key of ["fontSize", "secondFontSize"])
    if (style[key] !== undefined)
      style[key] = Math.max(16, Math.min(180, Math.round(style[key] * ratio)));
  for (const [key, min, max] of [
    ["lineGap", -20, 150],
    ["letterSpacing", -3, 30],
    ["secondLetterSpacing", -3, 30],
    ["outlineSize", 0, 20],
    ["secondOutlineSize", 0, 20],
    ["shadowSize", 0, 80],
    ["secondShadowSize", 0, 80],
  ])
    if (style[key] !== undefined)
      style[key] = Math.max(min, Math.min(max, style[key] * ratio));
  return style;
}
