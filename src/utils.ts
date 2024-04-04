export const lerp = (a: number, b: number, t: number) => {
  return a + t * (b - a);
};

export const parseHexColor = (hex: string) => ({
  r: parseInt(hex.substring(1, 3), 16),
  g: parseInt(hex.substring(3, 5), 16),
  b: parseInt(hex.substring(5, 7), 16),
});

export const lerpColor = (hex1: string, hex2: string, t: number) => {
  const color1 = parseHexColor(hex1);
  const color2 = parseHexColor(hex2);

  const r = Math.floor(lerp(color1.r, color2.r, t))
    .toString(16)
    .padStart(2, "0");
  const g = Math.floor(lerp(color1.g, color2.g, t))
    .toString(16)
    .padStart(2, "0");
  const b = Math.floor(lerp(color1.b, color2.b, t))
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b}`;
};

export const clamp = (x: number, min: number, max: number) => Math.min(Math.max(x, min), max);
