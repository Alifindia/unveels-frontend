export const textures = [
  {
    label: "Matte",
    value: "5625",
  },
  {
    label: "Shimmer",
    value: "5626",
  },
  {
    label: "Glossy",
    value: "5627",
  },
  {
    label: "Satin",
    value: "5628",
  },
  {
    label: "Metallic",
    value: "5629",
  },
  {
    label: "Sheer",
    value: "5630",
  },
];

export function filterTextures(selectedTextures: string[]) {
  const filteredTextures = textures.filter((texture) =>
    selectedTextures.includes(texture.label),
  );
  return filteredTextures;
}

export function filterTexturesByValue(selectedTextures: string[]) {
  const filteredTextures = textures.filter((texture) =>
    selectedTextures.includes(texture.value),
  );
  return filteredTextures;
}

export function getTextureFromLabel(label: string) {
  return textures.find((texture) => texture.label === label)?.value || null;
}
