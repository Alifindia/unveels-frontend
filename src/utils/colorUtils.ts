export type SkinType =
  | "Fair Skin"
  | "Medium Skin"
  | "Olive Skin"
  | "Tan Skin"
  | "Brown Skin"
  | "Deep Skin";

/**
 * Converts RGB values to Hex format.
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Calculates the average color from an array of RGB values.
 */
export const calculateAverageColor = (
  colors: Array<{ r: number; g: number; b: number }>,
) => {
  const total = colors.reduce(
    (acc, color) => {
      acc.r += color.r;
      acc.g += color.g;
      acc.b += color.b;
      return acc;
    },
    { r: 0, g: 0, b: 0 },
  );

  const count = colors.length;
  return {
    r: Math.round(total.r / count),
    g: Math.round(total.g / count),
    b: Math.round(total.b / count),
  };
};

/**
 * Classifies skin type based on the averaged RGB color.
 * This is a simplistic classification and can be refined.
 */
export const classifySkinType = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): SkinType => {
  // Convert RGB to HSV to better classify based on brightness
  const hsv = rgbToHsv(r, g, b);
  const { v } = hsv; // Value component represents brightness

  if (v > 0.9) return "Fair Skin";
  if (v > 0.8) return "Medium Skin";
  if (v > 0.7) return "Olive Skin";
  if (v > 0.6) return "Tan Skin";
  if (v > 0.5) return "Brown Skin";
  return "Deep Skin";
};

/**
 * Converts RGB to HSV.
 */
export const rgbToHsv = (
  r: number,
  g: number,
  b: number,
): { h: number; s: number; v: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    v = max;

  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return { h, s, v };
};
