import { useRef, useEffect, useState, CSSProperties } from "react";
import { useCamera } from "../context/recorder-context";
import { ChevronDown, ChevronLeft, Download, X } from "lucide-react";

export function ScreenshotPreview() {
  const { criterias, setCriterias, setScreenshotImage } = useCamera(); // Assuming setCriterias is available
  const { screenshotImage } = criterias;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isShareVisible, setIsShareVisible] = useState(true);
  const [isVisible, setIsVisible] = useState(true); // State to manage visibility of the component

  useEffect(() => {
    if (screenshotImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const image = new Image();
      image.src = screenshotImage;

      image.onload = () => {
        if (ctx) {
          const { innerWidth: width, innerHeight: height } = window;
          const dpr = window.devicePixelRatio || 1;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          const imgAspect = image.naturalWidth / image.naturalHeight;
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

          ctx.clearRect(0, 0, width, height);
          ctx.save();

          ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
          ctx.restore();

          // Add watermark with image only
          const watermarkImage = new Image();
          watermarkImage.src = "/media/unveels/images/unveels-logo.png"; // Replace with actual image path
          watermarkImage.onload = () => {
            const watermarkWidth = canvas.width / 4; // Increased size for sharper appearance
            const watermarkHeight =
              watermarkImage.height * (watermarkWidth / watermarkImage.width);
            const x = (canvas.width / 2 - watermarkWidth / 2) / dpr;
            const y = (canvas.height - watermarkHeight - 20) / dpr;
            ctx.globalAlpha = 1; // Set transparency
            ctx.drawImage(
              watermarkImage,
              x,
              y,
              watermarkWidth / dpr,
              watermarkHeight / dpr,
            );
            ctx.globalAlpha = 1.0; // Reset transparency
          };
        }
      };
    }
  }, [screenshotImage]);

  const downloadImage = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const link = document.createElement("a");
      link.download = "screenshot.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const toggleShareVisibility = () => {
    setIsShareVisible((prev) => !prev);
  };

  // Modify the closePreview function to clear the screenshotImage
  const closePreview = () => {
    setScreenshotImage("");
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute left-0 top-0 h-full w-screen"
      ></canvas>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
        <div className="flex flex-col gap-4">
          <button className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl">
            <ChevronLeft className="size-6 text-white" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
            onClick={closePreview} // Use closePreview to hide the component and clear the screenshotImage
          >
            <X className="size-6 text-white" />
          </button>

          <div className="relative -m-0.5 p-0.5">
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent"
              style={
                {
                  background: `linear-gradient(148deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.77) 100%) border-box`,
                  "-webkit-mask": `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
                  mask: `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
                  "-webkit-mask-composite": "destination-out",
                  "mask-composite": "exclude",
                } as CSSProperties
              }
            />
          </div>
        </div>
      </div>
      {isShareVisible && (
        <div className="absolute bottom-20 left-4 right-4 flex translate-y-0 transform flex-col items-center rounded-t-lg bg-black bg-opacity-50 p-4 shadow-md backdrop-blur-md transition-transform duration-300 ease-in-out">
          <p className="absolute left-4 top-4 text-[9.8px] font-semibold text-white sm:text-[9.8px]">
            Share to
          </p>
          <div className="mt-8 flex w-full justify-start">
            <div className="flex flex-col items-center">
              <div
                className={
                  "mb-2 flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full border border-white bg-white"
                }
                onClick={downloadImage}
              >
                <Download className="h-[16.8px] w-[16.8px] text-black" />
              </div>
              <span className="text-center text-[9.8px] text-white sm:whitespace-pre-line">
                Save to gallery
              </span>
            </div>
          </div>
        </div>
      )}
      <div
        className="absolute bottom-9 left-0 right-0 flex cursor-pointer flex-col items-center transition-transform duration-300 ease-in-out"
        onClick={toggleShareVisibility}
      >
        <ChevronDown
          className={`h-[38px] w-[38px] transform text-white sm:h-[16px] sm:w-[16px] ${isShareVisible ? "rotate-0" : "rotate-180"}`}
        />
      </div>
    </>
  );
}
