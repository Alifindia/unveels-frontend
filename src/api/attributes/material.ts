export const materials = [
  {
    label: "Plastic",
    value: "6490",
  },
  {
    label: "Metal",
    value: "6491",
  },
  {
    label: "Pearls",
    value: "6492",
  },
  {
    label: "Crystals",
    value: "6493",
  },
  {
    label: "Rubies",
    value: "6494",
  },
  {
    label: "Silver",
    value: "6495",
  },
  {
    label: "Silver Plated",
    value: "6496",
  },
  {
    label: "Gold Plated",
    value: "6497",
  },
  {
    label: "Brass",
    value: "6498",
  },
  {
    label: "Stainless",
    value: "6499",
  },
  {
    label: "Porcelain",
    value: "6645",
  },
];

export function filterMaterials(selectedMaterials: String[]) {
  return materials.filter((material) =>
    selectedMaterials.includes(material.label),
  );
}

export function filterMaterialsByValue(selectedMaterials: String[]) {
  return materials.filter((material) =>
    selectedMaterials.includes(material.value),
  );
}
