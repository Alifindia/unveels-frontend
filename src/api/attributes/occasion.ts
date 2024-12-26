export const occasions = [
  {
    label: "Formal",
    value: "5472",
  },
  {
    label: "Sport",
    value: "5473",
  },
  {
    label: "Casual",
    value: "5474",
  },
  {
    label: "Bridal",
    value: "6481",
  },
  {
    label: "Soiree",
    value: "6482",
  },
];

export function filterOccasions(selectedOccasions: string[]) {
  return occasions.filter((occasion) => {
    return selectedOccasions.includes(occasion.label);
  });
}

export function filterOccasionsByValue(selectedOccasions: string[]) {
  return occasions.filter((occasion) => {
    return selectedOccasions.includes(occasion.value);
  });
}
