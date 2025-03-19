import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const modes = [
  {
    name: "Nail Polish",
    path: "nail-polish",
  },
  {
    name: "Press on Nails",
    path: "press-on-nails",
  },
];

export function NailsMode() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
      {modes.map((mode, index) => (
        <Link to={`/smart-beauty/${mode.path}`} key={mode.path}>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1 border rounded-full gap-x-2 whitespace-nowrap border-white/80 text-white/80"
          >
            <span className="text-[9.8px] sm:text-sm">{t("vto." +mode.name)}</span>
          </button>
        </Link>
      ))}
    </div>
  );
}
