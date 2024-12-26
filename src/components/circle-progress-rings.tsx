import { Fragment } from "react";

interface ProgressItem {
  percentage: number;
  color: string;
}

interface CircularProgressRingsProps extends React.SVGProps<SVGSVGElement> {
  data: ProgressItem[];
}

export const CircularProgressRings: React.FC<CircularProgressRingsProps> = ({
  data,
  ...props
}) => {
  const viewBoxSize = 100;
  const center = viewBoxSize / 2;
  const maxRadius = 45;
  const strokeWidth = 3;
  const padding = 1.5;

  const calculatePath = (radius: number): string => {
    return `
        M ${center},${center - radius}
        A ${radius},${radius} 0 1 1 ${center - 0.001},${center - radius}
      `;
  };

  return (
    <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} {...props}>
      <g style={{ transform: "rotate(-270deg)", transformOrigin: "center" }}>
        {data.map((item, index) => {
          const radius = maxRadius - index * (strokeWidth + padding);
          const circumference = 2 * Math.PI * radius;
          const strokeDasharray = `${(circumference * item.percentage) / 100} ${circumference}`;

          return (
            <Fragment key={index}>
              {/* Background ring */}
              <path
                d={calculatePath(radius)}
                fill="none"
                stroke="#151A20"
                strokeWidth={strokeWidth}
              />
              {/* Progress ring */}
              <path
                d={calculatePath(radius)}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
              />
            </Fragment>
          );
        })}
      </g>
    </svg>
  );
};
