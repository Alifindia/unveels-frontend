export const colors = [
  { label: "White", value: "4", hex: "#FFFFFF" },
  { label: "Black", value: "5", hex: "#000000" },
  { label: "Red", value: "6", hex: "#FF0000" },
  { label: "Blue", value: "7", hex: "#1400FF" },
  { label: "Green", value: "8", hex: "#52FF00" },
  { label: "Beige", value: "5608", hex: "#F2D3BC" },
  { label: "Brass", value: "5609", hex: "#B5A642" },
  { label: "Brown", value: "5610", hex: "#3D0B0B" },
  {
    label: "Gold",
    value: "5611",
    hex: "linear-gradient(90deg, #CA9C43 0%, #C79A42 33%, #BE923E 56%, #AE8638 77%, #98752F 96%, #92702D 100%)",
  },
  { label: "Green", value: "5612", hex: "#52FF00" },
  { label: "Grey", value: "5613", hex: "#808080" },
  {
    label: "Multicolor",
    value: "5614",
    hex: "linear-gradient(270deg, #E0467C 0%, #E55300 25.22%, #00E510 47.5%, #1400FF 72%, #FFFA00 100%)",
  },
  { label: "Orange", value: "5615", hex: "#FF7A00" },
  { label: "Pink", value: "5616", hex: "#FE3699" },
  { label: "Purple", value: "5617", hex: "#800080" },
  { label: "Silver", value: "5618", hex: "#C0C0C0" },
  { label: "Transparent", value: "5619", hex: "none" },
  { label: "Yellow", value: "5620", hex: "#FFFF00" },
  { label: "Shimmer", value: "5621", hex: "#E8D5A6" },
  { label: "Bronze", value: "6478", hex: "#CD7F32" },
  { label: "Nude", value: "6479", hex: "#E1E1A3" },
];

export function filterColors(selectedColors: string[]) {
  return colors.filter((color) => selectedColors.includes(color.label));
}
