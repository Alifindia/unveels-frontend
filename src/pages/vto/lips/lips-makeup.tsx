import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const modes = [
  {
    name: "Lip Color",
    path: "lip-color",
  },
  {
    name: "Lip Liner",
    path: "lip-liner",
  },
  {
    name: "Lip Plumper",
    path: "lip-plumper",
  },
];
export function LipsMode() {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center w-full space-x-2 overflow-x-auto no-scrollbar">
      {modes.map((mode, index) => (
        <Link to={`/virtual-try-on/${mode.path}`} key={mode.path}>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1 border rounded-full gap-x-2 whitespace-nowrap border-white/80 text-white/80"
          >
            <span className="text-[9.8px] sm:text-sm">{t('vto.'+mode.name)}</span>
          </button>
        </Link>
      ))}
    </div>
  );
}
