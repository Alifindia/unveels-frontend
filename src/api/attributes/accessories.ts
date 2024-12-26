export const head_accessories_product_type = [
  {
    label: "Hats",
    value: "6504",
  },
  {
    label: "Head Bands",
    value: "6505",
  },
  {
    label: "Tiaras",
    value: "6506",
  },
  {
    label: "Sunglasses",
    value: "6507",
  },
  {
    label: "Glasses",
    value: "6508",
  },
  {
    label: "Earrings",
    value: "6551",
  },
];

export function headAccessoriesProductTypeFilter(product_types: string[]) {
  return head_accessories_product_type
    .filter((type) => product_types.includes(type.label))
    .map((product) => product.value);
}

export const neck_accessories_product_type = [
  {
    label: "Necklaces",
    value: "6509",
  },
  {
    label: "Pendants",
    value: "6510",
  },
  {
    label: "Chokers",
    value: "6511",
  },
  {
    label: "Scarves",
    value: "6512",
  },
];

export function neckAccessoriesProductTypeFilter(product_types: string[]) {
  return neck_accessories_product_type
    .filter((type) => product_types.includes(type.label))
    .map((product) => product.value);
}

export const hand_accessories_product_type = [
  {
    label: "Rings",
    value: "6500",
  },
  {
    label: "Watches",
    value: "6501",
  },
  {
    label: "Bracelets",
    value: "6502",
  },
  {
    label: "Bangles",
    value: "6503",
  },
];

export function handAccessoriesProductTypeFilter(product_types: string[]) {
  return hand_accessories_product_type
    .filter((type) => product_types.includes(type.label))
    .map((product) => product.value);
}
