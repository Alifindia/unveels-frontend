import clsx from "clsx";

type SinglePalette = {
  name?: string;
  color: string; // Hex. eg. #FFFFFF
};

type GradientPalette = {
  name?: string;
  gradient: string[]; // Hexes. eg.[#FFFFFF, #FFAABB]
};

type TriplePalette = {
  name?: string;
  colors: [string, string, string]; // Hexes. eg.[#FFFFFF, #FFAABB, #FFCCDD]
};

type QuadruplePalette = {
  name?: string;
  colors: [string, string, string, string]; // Hexes. eg.[#FFFFFF, #FFAABB, #FFCCDD, #FFEEFF]
};

type PaletteType =
  | SinglePalette
  | GradientPalette
  | TriplePalette
  | QuadruplePalette;

export function ColorPalette({
  palette,
  size,
  selected = false,
  onClick,
}: {
  size: "small" | "large";
  palette: PaletteType;
  selected?: boolean;
  onClick?: () => void;
}) {
  if ("color" in palette) {
    return (
      <button
        className={clsx("shrink-0 rounded-full border border-transparent transform transition-all", {
          "size-5 sm:size-[1.875rem]": size === "large",
          "size-2.5": size === "small",
          "border-white scale-[1.3]": selected,
        })}
        style={{ background: palette.color }}
        onClick={onClick}
      />
    );
  }

  if ("gradient" in palette) {
    return (
      <button
        className={clsx("shrink-0 rounded-full border border-transparent", {
          "size-10": size === "large",
          "size-2.5": size === "small",
          "border-white": selected,
        })}
        style={{
          background: `linear-gradient(270deg, ${palette.gradient[0]} 0%, ${palette.gradient[1]} 100%)`,
        }}
        onClick={onClick}
      />
    );
  }

  return (
    <button
      className={clsx("shrink-0 rounded-full border border-transparent", {
        "size-10": size === "large",
        "size-2.5": size === "small",
        "border-white": selected,
      })}
      onClick={onClick}
    >
      <ColorPieChart colors={palette.colors} />
    </button>
  );
}

const ColorPieChart = ({ colors }: { colors: string[] }) => {
  const totalSegments = colors.length;
  const segmentAngle = 360 / totalSegments;

  const createSegmentPath = (startAngle: number, endAngle: number) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const radius = 50;
    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {colors.map((color, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;
        return (
          <path
            key={index}
            d={createSegmentPath(startAngle, endAngle)}
            fill={color}
          />
        );
      })}
    </svg>
  );
};
