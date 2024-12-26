import { Link } from "react-router-dom";

const modes = [
  { name: "Eyebrows", path: "eyebrows" },
  { name: "Eye Shadow", path: "eye-shadow" },
  { name: "Eye Liner", path: "eye-liner" },
  { name: "Lashes", path: "lashes" },
  { name: "Mascara", path: "mascara" },
  { name: "Lenses", path: "lenses" },
];

export function EyesMode() {
  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar">
      {modes.map((mode, index) => (
        <Link to={`/virtual-try-on-makeups/${mode.path}`} key={mode.path}>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-x-2 whitespace-nowrap rounded-full border border-white/80 px-3 py-1 text-white/80"
          >
            <span className="text-[9.8px] sm:text-sm">{mode.name}</span>
          </button>
        </Link>
      ))}
    </div>
  );
}
