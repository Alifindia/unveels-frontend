export const sizes = [
  {
    label: "Small",
    value: "5975",
  },
  {
    label: "Medium",
    value: "10",
  },
  {
    label: "Large",
    value: "11",
  },
  {
    label: "Extra Large",
    value: "12",
  },
  {
    label: "46-50ml",
    value: "5587",
  },
  {
    label: "6-10ml",
    value: "5588",
  },
  {
    label: "71-75ml",
    value: "5589",
  },
  {
    label: "26-30ml",
    value: "5590",
  },
  {
    label: "51-55ml",
    value: "5591",
  },
  {
    label: "16-20ml",
    value: "5592",
  },
  {
    label: "76-80ml",
    value: "5593",
  },
  {
    label: "31-35ml",
    value: "5594",
  },
  {
    label: "36-40ml",
    value: "5595",
  },
  {
    label: "86-90ml",
    value: "5596",
  },
  {
    label: "41-45ml",
    value: "5597",
  },
  {
    label: "66-70ml",
    value: "5598",
  },
  {
    label: "56-60ml",
    value: "5599",
  },
  {
    label: "21-25ml",
    value: "5600",
  },
  {
    label: "11-15ml",
    value: "5601",
  },
  {
    label: "81-85ml",
    value: "5602",
  },
  {
    label: "61-65ml",
    value: "5603",
  },
  {
    label: "1-5ml",
    value: "5604",
  },
  {
    label: "91-95ml",
    value: "5605",
  },
  {
    label: "96-100ml",
    value: "5606",
  },
  {
    label: "100+ml",
    value: "5607",
  },
  {
    label: "3",
    value: "6568",
  },
  {
    label: "3.5",
    value: "6569",
  },
  {
    label: "4",
    value: "6570",
  },
  {
    label: "4.5",
    value: "6571",
  },
  {
    label: "5",
    value: "6572",
  },
  {
    label: "5.5",
    value: "6573",
  },
  {
    label: "6",
    value: "6574",
  },
  {
    label: "6.5",
    value: "6575",
  },
  {
    label: "7",
    value: "6576",
  },
  {
    label: "7.5",
    value: "6577",
  },
  {
    label: "8",
    value: "6578",
  },
  {
    label: "8.5",
    value: "6579",
  },
  {
    label: "9",
    value: "6580",
  },
  {
    label: "9.5",
    value: "6581",
  },
  {
    label: "10",
    value: "6582",
  },
  {
    label: "10.5",
    value: "6583",
  },
  {
    label: "11",
    value: "6584",
  },
  {
    label: "11.5",
    value: "6585",
  },
  {
    label: "12",
    value: "6586",
  },
  {
    label: "12.5",
    value: "6587",
  },
  {
    label: "13",
    value: "6588",
  },
  {
    label: "13.5",
    value: "6589",
  },
];

export function getSizePartials(labels: string[]) {
  return sizes.filter((size) => {
    return labels.includes(size.label);
  });
}
