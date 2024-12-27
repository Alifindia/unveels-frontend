import clsx from "clsx";
import { Lightbulb, Scan, ScanFace } from "lucide-react";
import { useEffect, useState } from "react";
import { useCamera } from "../../context/recorder-context";
import { useTranslation } from "react-i18next";

function RecorderGuide() {
  const { t } = useTranslation();
  const {
    criterias: { facePosition, lighting, orientation },
  } = useCamera();

  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [filteredHints, setFilteredHints] = useState<string[]>([]);

  // Function to filter hints based on unmet criteria
  const getFilteredHints = () => {
    const hintsToShow: string[] = [];

    const facePositionHints = t("hints.facePosition", { returnObjects: true });
    if (Array.isArray(facePositionHints)) {
      hintsToShow.push(...facePositionHints);
    }

    const lightingHints = t("hints.lighting", { returnObjects: true });
    if (Array.isArray(lightingHints)) {
      hintsToShow.push(...lightingHints);
    }

    const orientationHints = t("hints.orientation", { returnObjects: true });
    if (Array.isArray(orientationHints)) {
      hintsToShow.push(...orientationHints);
    }

    return hintsToShow;
  };

  // Update filtered hints whenever criteria change
  useEffect(() => {
    const newFilteredHints = getFilteredHints();
    setFilteredHints(newFilteredHints);
    setCurrentHintIndex(0); // Reset hint index when hints change
  }, [facePosition, lighting, orientation]);

  // Cycle through hints at a set interval (e.g., every 5 seconds)
  useEffect(() => {
    if (filteredHints.length === 0) return; // No hints to show

    const interval = setInterval(() => {
      setCurrentHintIndex(
        (prevIndex) => (prevIndex + 1) % filteredHints.length,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [filteredHints]);

  // If no hints to show, display a default message or nothing
  if (filteredHints.length === 0) {
    return null; // Or you can return a message like <p>All criteria met!</p>
  }

  return (
    <div className="flex select-none justify-center px-4 pb-4 text-center text-white">
      <div className="w-full max-w-md">
        <p className="pb-4">{filteredHints[currentHintIndex]}</p>

        <div className="grid grid-cols-3 gap-3 text-xs text-white/50">
          {/* Face Position */}
          <div
            className={clsx(
              "flex items-center justify-between whitespace-nowrap rounded-lg border px-1.5 py-1 text-[9px] md:px-2.5 md:py-2 md:text-xs",
              facePosition
                ? "border-white text-white [background:linear-gradient(90deg,_#CA9C43_0%,_#916E2B_27.4%,_#6A4F1B_59.4%,_#473209_100%);]"
                : "border-dashed border-white/50",
            )}
          >
            <span className="truncate md:whitespace-normal">
              {t("criteria.facePosition")}
            </span>
            <ScanFace className="size-5 md:size-6" />
          </div>

          {/* Lighting */}
          <div
            className={clsx(
              "flex items-center justify-between whitespace-nowrap rounded-lg border px-1.5 py-1 text-[9px] md:px-2.5 md:py-2 md:text-xs",
              lighting
                ? "border-white text-white [background:linear-gradient(90deg,_#CA9C43_0%,_#916E2B_27.4%,_#6A4F1B_59.4%,_#473209_100%);]"
                : "border-dashed border-white/50",
            )}
          >
            <span className="truncate md:whitespace-normal">
              {t("criteria.lighting")}
            </span>
            <Lightbulb className="size-5 md:size-6" />
          </div>

          {/* Orientation */}
          <div
            className={clsx(
              "flex items-center justify-between whitespace-nowrap rounded-lg border px-1.5 py-1 text-[9px] md:px-2.5 md:py-2 md:text-xs",
              orientation
                ? "border-white text-white [background:linear-gradient(90deg,_#CA9C43_0%,_#916E2B_27.4%,_#6A4F1B_59.4%,_#473209_100%);]"
                : "border-dashed border-white/50",
            )}
          >
            <span className="truncate md:whitespace-normal">
              {t("criteria.orientation")}
            </span>
            <Scan className="size-5 md:size-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoScene() {
  return <RecorderGuide />;
}
