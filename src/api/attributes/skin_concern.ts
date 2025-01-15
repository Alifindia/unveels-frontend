export const skin_concerns = [
  {
    label: "Oily Skin",
    value: "5825",
  },
  {
    label: "Dark Circles",
    value: "5826",
  },
  {
    label: "Anti Aging",
    value: "5827",
  },
  {
    label: "Wrinkles",
    value: "5828",
  },
  {
    label: "Damaged Skin",
    value: "5829",
  },
  {
    label: "Fine Lines",
    value: "5830",
  },
  {
    label: "Sensitive Skin",
    value: "5831",
  },
  {
    label: "Redness",
    value: "5832",
  },
  {
    label: "Acne",
    value: "5833",
  },
  {
    label: "Spots",
    value: "5834",
  },
  {
    label: "Uneven Skintone",
    value: "5835",
  },
  {
    label: "Dry Skin",
    value: "5836",
  },
  {
    label: "Pores",
    value: "5837",
  },
  {
    label: "Black Heads",
    value: "5838",
  },
  {
    label: "Blemishes",
    value: "5839",
  },
  {
    label: "Lip Lines",
    value: "5840",
  },
];

export const faceMakeupProductTypesFilter = (productTypes: String[]) => {
  const filteredFaceProductTypes = skin_concerns
    .filter((product) => productTypes.includes(product.label))
    .map((product) => product.value)
    .join(",");
  return filteredFaceProductTypes;
};

export const faceSkinConcernProductTypesMap = skin_concerns.reduce(
  (acc, { label, value }) => {
    acc[label] = value;
    return acc;
  },
  {} as Record<string, string>,
);

export function getSkinConcernProductTypeIds(labels: string[]): string[] {
  return labels.map((label) => faceSkinConcernProductTypesMap[label]);
}