export const shapes = [
  {
    label: "Oversized",
    value: "5507",
  },
  {
    label: "Square",
    value: "5508",
  },
  {
    label: "Wayfarer",
    value: "5509",
  },
  {
    label: "Tortoise",
    value: "5510",
  },
  {
    label: "Cat Eye",
    value: "5511",
  },
  {
    label: "Clubmaster",
    value: "5512",
  },
  {
    label: "Triangle",
    value: "5513",
  },
  {
    label: "Octagonal",
    value: "5514",
  },
  {
    label: "Clipon",
    value: "5515",
  },
  {
    label: "Shield",
    value: "5516",
  },
  {
    label: "Aviator",
    value: "5517",
  },
  {
    label: "Round",
    value: "5518",
  },
  {
    label: "Navigator",
    value: "5519",
  },
  {
    label: "Rectangular",
    value: "5520",
  },
  {
    label: "Studs",
    value: "6483",
  },
  {
    label: "Cuffs",
    value: "6484",
  },
  {
    label: "Hoops",
    value: "6485",
  },
  {
    label: "Dangling",
    value: "6486",
  },
  {
    label: "Circle",
    value: "6487",
  },
  {
    label: "Oval",
    value: "6488",
  },
  {
    label: "Beret",
    value: "6552",
  },
  {
    label: "Fidora",
    value: "6553",
  },
  {
    label: "Triby",
    value: "6554",
  },
  {
    label: "Cloche",
    value: "6555",
  },
  {
    label: "Bucket",
    value: "6556",
  },
  {
    label: "Boater",
    value: "6557",
  },
  {
    label: "Brimmed",
    value: "6558",
  },
  {
    label: "Cowboy",
    value: "6559",
  },
  {
    label: "Baseball",
    value: "6560",
  },
  {
    label: "Newsboy",
    value: "6561",
  },
  {
    label: "Bowler",
    value: "6562",
  },
  {
    label: "Turban",
    value: "6563",
  },
  {
    label: "Cap",
    value: "6564",
  },
  {
    label: "Ascot",
    value: "6565",
  },
  {
    label: "Beanie",
    value: "6566",
  },
  {
    label: "Chef",
    value: "6567",
  },
];

export function filterShapes(selectedShapes: String[]) {
  const filteredShapes = shapes.filter((shape) =>
    selectedShapes.includes(shape.label),
  );
  return filteredShapes;
}

export function filterShapesByValue(selectedShapes: String[]) {
  const filteredShapes = shapes.filter((shape) =>
    selectedShapes.includes(shape.value),
  );
  return filteredShapes;
}
