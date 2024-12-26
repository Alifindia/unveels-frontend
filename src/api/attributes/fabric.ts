export const fabrics = [
  {
    label: "Denim",
    value: "5493",
  },
  {
    label: "Faux Leather",
    value: "5494",
  },
  {
    label: "PVC Leather",
    value: "5495",
  },
  {
    label: "Tweed",
    value: "5496",
  },
  {
    label: "Aged Leather",
    value: "5497",
  },
  {
    label: "Nylon",
    value: "5498",
  },
  {
    label: "Polyester",
    value: "5499",
  },
  {
    label: "Cotton",
    value: "5500",
  },
  {
    label: "Felt",
    value: "5501",
  },
  {
    label: "Burlap",
    value: "5502",
  },
  {
    label: "PU Leather",
    value: "5503",
  },
  {
    label: "Swede",
    value: "5504",
  },
  {
    label: "Velvet",
    value: "5505",
  },
  {
    label: "Genuine Leather",
    value: "5506",
  },
  {
    label: "Leather",
    value: "6489",
  },
];

export function filterFabrics(selectedFabrics: string[]) {
  return fabrics.filter((fabric) => selectedFabrics.includes(fabric.label));
}

export function filterFabricsByValue(selectedFabrics: string[]) {
  return fabrics.filter((fabric) => selectedFabrics.includes(fabric.value));
}
