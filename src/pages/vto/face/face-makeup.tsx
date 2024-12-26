import { Link } from "react-router-dom";

const modes = [
  { name: "Foundation", path: "foundation" },
  { name: "Concealer", path: "concealer" },
  { name: "Contour", path: "contour" },
  { name: "Blush", path: "blush" },
  { name: "Bronzer", path: "bronzer" },
  { name: "Highlighter", path: "highlighter" },
];

export function FaceMode() {
  return (
    <div className="flex items-center w-full space-x-2 overflow-x-auto no-scrollbar">
      {modes.map((mode, index) => (
        <Link to={`/virtual-try-on/${mode.path}`} key={mode.path}>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1 border rounded-full gap-x-2 border-white/80 text-white/80 shrink-0 whitespace-nowrap"
          >
            <span className="text-[9.8px] sm:text-sm">{mode.name}</span>
          </button>
        </Link>
      ))}
    </div>
  );
}
