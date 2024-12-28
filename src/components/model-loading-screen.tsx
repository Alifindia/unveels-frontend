import { useTranslation } from "react-i18next";

export function ModelLoadingScreen({ progress }: { progress: number }) {
    const { t } = useTranslation();
  
  const message =
    progress < 70
      ? "Loading Models..."
      : progress < 100
        ? "Warming Up Models..."
        : "Almost Ready!";

  const progressImageUrl = "/media/unveels/images/loading.gif";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="text-center text-white">
        <p className="mb-4 animate-pulse text-lg font-semibold">
          {t("model_loading.label")}
        </p>
        <div className="mt-4">
          <img
            src={progressImageUrl}
            alt={`Progress: ${progress}%`}
            className="mx-auto w-full max-w-xs"
          />
        </div>
      </div>
    </div>
  );
}
