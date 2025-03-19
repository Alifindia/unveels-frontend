import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const modes = [
  {
    name: "Hair Color",
    path: "hair-color",
  },
];

export function HairMode() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
      {modes.map((mode, index) => (
        <Link to={`/virtual-try-on-makeups/${mode.path}`} key={mode.path}>
          <button
            type="button"
            className="inline-flex items-center gap-x-2 whitespace-nowrap rounded-full border border-white/80 px-3 py-1 text-white/80"
          >
            <span className="text-[9.8px] sm:text-sm">{t("vto." +mode.name)}</span>
          </button>
        </Link>
      ))}
    </div>
  );
}
