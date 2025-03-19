import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar">
      {modes.map((mode, index) => (
        <Link to={`/virtual-try-on/${mode.path}`} key={mode.path}>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-x-2 whitespace-nowrap rounded-full border border-white/80 px-3 py-1 text-white/80"
          >
            <span className="text-[9.8px] xl:text-[10px] 2xl:text-sm">
              {t("vto." + mode.name)}
            </span>
          </button>
        </Link>
      ))}
    </div>
  );
}
