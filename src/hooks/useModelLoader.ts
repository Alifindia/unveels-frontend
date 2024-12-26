import { useState } from "react";

export function useModelLoader(steps: Array<() => Promise<void>>) {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadModels = async () => {
    for (let i = 0; i < steps.length; i++) {
      await steps[i]();

      // Tambahkan jeda untuk transisi yang lebih halus
      await new Promise((resolve) => setTimeout(resolve, 300)); // Jeda 300ms

      setProgress(Math.round(((i + 1) / steps.length) * 100));
    }
    setIsLoading(false);
  };

  return { progress, isLoading, loadModels };
}
