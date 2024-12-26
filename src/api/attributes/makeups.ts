export const lips_makeup_product_types = [
  {
    label: "Lip Primers",
    value: "5725",
  },
  {
    label: "Lipsticks",
    value: "5726",
  },
  {
    label: "Lip Stains",
    value: "5727",
  },
  {
    label: "Lip Tints",
    value: "5728",
  },
  {
    label: "Lip Liners",
    value: "5729",
  },
  {
    label: "Lip Glosses",
    value: "5730",
  },
  {
    label: "Lip Balms",
    value: "5731",
  },
  {
    label: "Lip Plumpers",
    value: "5732",
  },
];

export const lipsMakeupProductTypesFilter = (productTypes: String[]) => {
  const filteredLipsProductTypes = lips_makeup_product_types
    .filter((product) => productTypes.includes(product.label))
    .map((product) => product.value)
    .join(",");
  return filteredLipsProductTypes;
};

export const lipsMakeupProductTypesMap = lips_makeup_product_types.reduce(
  (acc, { label, value }) => {
    acc[label] = value;
    return acc;
  },
  {} as Record<string, string>,
);

export function getLipsMakeupProductTypeIds(labels: string[]): string[] {
  return labels.map((label) => lipsMakeupProductTypesMap[label]);
}

export const face_makeup_product_types = [
  {
    label: "Foundations",
    value: "5715",
  },
  {
    label: "Blushes",
    value: "5716",
  },
  {
    label: "Highlighters",
    value: "5717",
  },
  {
    label: "Correctors",
    value: "5718",
  },
  {
    label: "Primers",
    value: "5719",
  },
  {
    label: "Compact Powders",
    value: "5720",
  },
  {
    label: "Bronzers",
    value: "5721",
  },
  {
    label: "Contouring",
    value: "5722",
  },
  {
    label: "Face Makeup Removers",
    value: "5723",
  },
  {
    label: "Loose Powders",
    value: "5724",
  },
];

export const faceMakeupProductTypesFilter = (productTypes: String[]) => {
  const filteredFaceProductTypes = face_makeup_product_types
    .filter((product) => productTypes.includes(product.label))
    .map((product) => product.value)
    .join(",");
  return filteredFaceProductTypes;
};

export const faceMakeupProductTypesMap = face_makeup_product_types.reduce(
  (acc, { label, value }) => {
    acc[label] = value;
    return acc;
  },
  {} as Record<string, string>,
);

export function getFaceMakeupProductTypeIds(labels: string[]): string[] {
  return labels.map((label) => faceMakeupProductTypesMap[label]);
}

const lashMakeupProductType = [
  {
    label: "Mascaras",
    value: "5709",
  },
  {
    label: "Lash Curlers",
    value: "5710",
  },
  {
    label: "Individual False Lashes",
    value: "5711",
  },
  {
    label: "Full Line Lashes",
    value: "5712",
  },
];

export const lashMakeupProductTypeMap = lashMakeupProductType.reduce(
  (acc, { label, value }) => {
    acc[label] = value;
    return acc;
  },
  {} as Record<string, string>,
);

export function getLashMakeupProductTypeIds(labels: string[]): string[] {
  return labels.map((label) => lashMakeupProductTypeMap[label]);
}

export const lensesProductType = [
  {
    label: "Daily Lenses",
    value: "5713",
  },
  {
    label: "Monthly Lenses",
    value: "5714",
  },
];

export const lensesProductTypeMap = lensesProductType.reduce(
  (acc, { label, value }) => {
    acc[label] = value;
    return acc;
  },
  {} as Record<string, string>,
);

export function getLensesProductTypeIds(labels: string[]): string[] {
  return labels.map((label) => lensesProductTypeMap[label]);
}

export const eye_makeup_product_types = [
  {
    label: "Eyeshadows",
    value: "5702",
  },
  {
    label: "Eyeliners",
    value: "5703",
  },
  {
    label: "Concealers",
    value: "5704",
  },
  {
    label: "Eye Pencils",
    value: "5705",
  },
  {
    label: "Eye Color Correctors",
    value: "5706",
  },
  {
    label: "Eye Primers",
    value: "5707",
  },
  {
    label: "Eye Makeup Removers",
    value: "5708",
  },
];

export const eyeMakeupProductTypesMap = eye_makeup_product_types.reduce(
  (acc, { label, value }) => {
    acc[label] = value;
    return acc;
  },
  {} as Record<string, string>,
);

export function getEyeMakeupProductTypeIds(labels: string[]): string[] {
  return labels.map((label) => eyeMakeupProductTypesMap[label]);
}

export const nail_polish_product_types = [
  {
    label: "Nail Color",
    value: "5683",
  },
  {
    label: "Gel Color",
    value: "5684",
  },
  {
    label: "Glossy Top Coats",
    value: "5685",
  },
  {
    label: "Base Coats",
    value: "5686",
  },
  {
    label: "Nail Polish Removers",
    value: "5687",
  },
  {
    label: "Breathable Polishes",
    value: "5688",
  },
  {
    label: "Matte Top Coats",
    value: "5689",
  },
  {
    label: "Gel Top Coats",
    value: "5690",
  },
  {
    label: "Gel Primers",
    value: "5691",
  },
  {
    label: "Quick Dry Top Coats",
    value: "5692",
  },
];

export const nailPolishProductTypesMap = nail_polish_product_types.reduce(
  (acc, { label, value }) => {
    acc[label] = value;
    return acc;
  },
  {} as Record<string, string>,
);

export function getNailPolishProductTypeIds(labels: string[]): string[] {
  return labels.map((label) => nailPolishProductTypesMap[label]);
}

export const nails_product_types = [
  {
    label: "Press on Nails",
    value: "6513",
  },
];

export const nailsProductTypesMap = nails_product_types.reduce(
  (acc, { label, value }) => {
    acc[label] = value;
    return acc;
  },
  {} as Record<string, string>,
);

export function getNailsProductTypeIds(labels: string[]): string[] {
  return labels.map((label) => nailsProductTypesMap[label]);
}
