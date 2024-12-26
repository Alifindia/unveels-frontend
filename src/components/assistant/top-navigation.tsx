import { ChevronLeft, X } from "lucide-react";
import { Link } from "react-router-dom";

const TopNavigation = ({ onBack }: { onBack?: () => void }) => {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 [&_button]:pointer-events-auto">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
          onClick={() => {
            onBack?.();
          }}
        >
          <ChevronLeft className="size-6 text-white" />
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <Link
          type="button"
          className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
          to="/"
        >
          <X className="size-6 text-white" />
        </Link>
      </div>
    </div>
  );
};

export default TopNavigation;
