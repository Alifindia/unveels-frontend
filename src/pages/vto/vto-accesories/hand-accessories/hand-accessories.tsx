import { Link } from "react-router-dom";

const modes = [
  {
    name: "Watches",
    path: "watches",
  },
  {
    name: "Rings",
    path: "rings",
  },
  {
    name: "Bracelets",
    path: "bracelets",
  },
  {
    name: "Bangles",
    path: "bangles",
  },
];

export function HandAccessoriesMode() {
  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar">
      {modes.map((mode, index) => (
        <Link to={`/virtual-try-on-accesories/${mode.path}`} key={mode.path}>
          <button
            type="button"
            className="inline-flex items-center gap-x-2 whitespace-nowrap rounded-full border border-white/80 px-3 py-1 text-white/80"
          >
            <span className="text-[9.8px] sm:text-sm">{mode.name}</span>
          </button>
        </Link>
      ))}
    </div>
  );
}
