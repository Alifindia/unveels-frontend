import { Link } from "react-router-dom";

const modes = [
  {
    name: "Sunglasses",
    path: "sunglasses",
  },
  {
    name: "Glasses",
    path: "glasses",
  },
  {
    name: "Earrings",
    path: "earrings",
  },
  {
    name: "Hats",
    path: "hats",
  },
  {
    name: "Tiaras",
    path: "tiaras",
  },
  {
    name: "Headbands",
    path: "headbands",
  },
];

export function HeadAccessoriesMode() {
  return (
    <div className="flex items-center w-full space-x-2 overflow-x-auto no-scrollbar">
      {modes.map((mode, index) => (
        <Link to={`/virtual-try-on-accesories/${mode.path}`} key={mode.path}>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1 border rounded-full gap-x-2 whitespace-nowrap border-white/80 text-white/80"
          >
            <span className="text-[9.8px] sm:text-sm">{mode.name}</span>
          </button>
        </Link>
      ))}
    </div>
  );
}
