// Compatibility for older sx/styled surfaces that still use literal colors.
// Keep the original light appearance and adapt only colors, never images.
const colors = /#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{4}\b|#[\da-f]{3}\b|rgba?\([^)]*\)|\b(?:white|black|whitesmoke|gray|grey)\b/gi;

// adaptiveColor() (below) is a *legacy-compat* shim: it exists to auto-fix
// components that never got a theme-aware sx. It has no way to know a color
// was already chosen deliberately for the current theme.palette.mode, so it
// keeps "fixing" already-correct dark-mode colors too — most visibly, any
// bright dark-mode color used as a *background* (brightness > .65 always
// triggers the darken branch below) gets silently re-darkened into a muddy,
// off-hue color instead of staying as authored. `pinColor` locks a value in
// by wrapping it in light-dark(x, x): the plugin's own skip-check
// (`/var\(|light-dark\(|url\(/`) then leaves it alone in both color schemes.
// Use it at the exact call site of a dark-mode color you already picked
// yourself — never on a theme.palette.* value used for MUI's internal JS
// color math (alpha/darken/lighten), which cannot parse light-dark().
export const pinColor = (color) => `light-dark(${color}, ${color})`;
const names = { white: '#ffffff', black: '#000000', whitesmoke: '#f5f5f5', gray: '#808080', grey: '#808080' };

export function adaptiveColor(value, property) {
  if (typeof value !== 'string' || /var\(|light-dark\(|url\(/.test(value)) return value;
  const background = /^background/.test(property);
  const foreground = /^(color|fill|stroke|caret-color)$/.test(property);
  const border = /^(border|outline)/.test(property);
  if (!background && !foreground && !border) return value;
  return value.replace(colors, (original) => {
    let color = names[original.toLowerCase()] || original;
    let channels;
    let alpha = 1;
    if (color[0] === '#') {
      color = color.slice(1);
      if (color.length <= 4) color = [...color].map((c) => c + c).join('');
      channels = [0, 2, 4].map((i) => parseInt(color.slice(i, i + 2), 16));
      if (color.length === 8) alpha = parseInt(color.slice(6), 16) / 255;
    } else {
      if (color.includes('%')) return original;
      const parts = color.match(/[\d.]+/g)?.map(Number);
      if (!parts || parts.length < 3) return original;
      channels = parts.slice(0, 3);
      alpha = parts[3] ?? 1;
    }
    if (!alpha) return original;
    const brightness = (channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722) / 255;
    let dark;
    if (background && brightness > .65) {
      dark = channels.map((c) => Math.round(22 + (255 - c) * .12));
    } else if (foreground && brightness < .65) {
      dark = channels.map((c) => Math.round(c + (255 - c) * .72));
    } else if (border) {
      // A border already tinted toward the brand green marks an "important"
      // surface (card, section, form container, table) in the light theme.
      // Keep that signal visible in dark mode as a clear, subtle accent
      // instead of flattening every border to the same neutral tone.
      const isBrandGreen = channels[1] > channels[0] * 1.15 && channels[1] > channels[2] * 1.15;
      dark = isBrandGreen ? [103, 201, 157] : [65, 86, 77];
    } else return original;
    return `light-dark(${original}, rgba(${dark.join(', ')}, ${alpha}))`;
  });
}

export function adaptiveColorsPlugin(element) {
  if (element.type === 'decl') {
    const next = adaptiveColor(element.children, element.props);
    if (next !== element.children) {
      element.children = next;
      element.value = `${element.props}:${next};`;
    }
  }
}

export function adaptiveInlineStyle(style) {
  if (!style || typeof style !== 'object') return style;
  return Object.fromEntries(Object.entries(style).map(([property, value]) => [
    property, adaptiveColor(value, property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)),
  ]));
}
