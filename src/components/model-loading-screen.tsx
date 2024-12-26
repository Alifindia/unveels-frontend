export function ModelLoadingScreen({ progress }: { progress: number }) {
  const message =
    progress < 70
      ? "Loading Models..."
      : progress < 100
        ? "Warming Up Models..."
        : "Almost Ready!";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="text-center text-white">
        <p className="mb-4 animate-pulse text-lg font-semibold">{message}</p>
        <div className="relative h-2 w-64 overflow-hidden rounded bg-gray-700">
          <div
            className="absolute h-full rounded bg-white transition-all duration-200"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm">{progress}%</p>
      </div>
    </div>
  );
}
