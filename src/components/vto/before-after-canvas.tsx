import { useEffect } from "react";

export interface BeforeAfterCanvasProps {
  image: HTMLImageElement | HTMLVideoElement;
  mode: "IMAGE" | "VIDEO" | "LIVE";
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function BeforeAfterCanvas({ image, canvasRef, mode }: BeforeAfterCanvasProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Gagal mendapatkan konteks 2D untuk overlay canvas.");
      return;
    }

    let animationFrameId: number;

    const setupCanvasSize = () => {
      const { innerWidth: width, innerHeight: height } = window;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    const draw = () => {
      const { innerWidth: width, innerHeight: height } = window;

      let imgAspect = 0;
      if (mode === "IMAGE" && image instanceof HTMLImageElement) {
        imgAspect = image.naturalWidth / image.naturalHeight;
      } else if ((mode === "VIDEO" || mode == "LIVE") &&
        image instanceof HTMLVideoElement) {
        imgAspect = image.videoWidth / image.videoHeight;
      }

      const canvasAspect = width / height;

      let drawWidth: number;
      let drawHeight: number;
      let offsetX: number;
      let offsetY: number;

      if (imgAspect < canvasAspect) {
        drawWidth = width;
        drawHeight = width / imgAspect;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      } else {
        drawWidth = height * imgAspect;
        drawHeight = height;
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(
        image,
        -offsetX - drawWidth,
        offsetY,
        drawWidth,
        drawHeight
      );
      ctx.restore();

      if ((mode === "VIDEO" || mode === "LIVE") &&
        image instanceof HTMLVideoElement) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    const startRendering = () => {
      setupCanvasSize();
      draw();

      if (mode === "IMAGE") {
        window.addEventListener("resize", () => {
          setupCanvasSize();
          draw();
        });
      }
    };

    startRendering();

    return () => {
      if (mode === "VIDEO" || mode === "LIVE") {
        cancelAnimationFrame(animationFrameId);
      }
      if (mode === "IMAGE") {
        window.removeEventListener("resize", setupCanvasSize);
      }
    };
  }, [image, canvasRef, mode]);

  return null;
}
