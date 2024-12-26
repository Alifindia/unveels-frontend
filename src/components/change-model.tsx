import React, { CSSProperties, useEffect, useState } from "react";

interface ChangeModelProps {
  onClose: () => void;
}
const ChangeModel: React.FC<ChangeModelProps> = ({ onClose }) => {
  const [showGrid, setShowGrid] = useState(true);

  const images = [
    { src: "/media/unveels/vto/choose-model/model1.png", alt: "Model image 1" },
    { src: "/media/unveels/vto/choose-model/model2.png", alt: "Model image 2" },
    { src: "/media/unveels/vto/choose-model/model3.png", alt: "Model image 3" },
    { src: "/media/unveels/vto/choose-model/model4.png", alt: "Model image 4" },
    { src: "/media/unveels/vto/choose-model/model5.png", alt: "Model image 5" },
    { src: "/media/unveels/vto/choose-model/model6.png", alt: "Model image 6" },
    { src: "/media/unveels/vto/choose-model/model7.png", alt: "Model image 7" },
    { src: "/media/unveels/vto/choose-model/model8.png", alt: "Model image 8" },
    { src: "/media/unveels/vto/choose-model/model9.png", alt: "Model image 9" },
  ];

  const handleBack = () => {
    onClose();
  };

  const handleDismiss = () => {
    setShowGrid(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ImageGrid
        images={images}
        onBack={handleBack}
        onDismiss={handleDismiss}
      />
    </div>
  );
};

import { ChevronLeft, X } from "lucide-react";

interface ImageGridProps {
  images?: {
    src: string;
    alt: string;
  }[];
  onBack?: () => void;
  onDismiss?: () => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  images = [],
  onBack,
  onDismiss,
}) => {
  const [loadedImages, setLoadedImages] = useState<number[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{
    [key: number]: { width: number; height: number };
  }>({});

  useEffect(() => {
    images.forEach((image, index) => {
      const img = new Image();
      img.onload = () => {
        setImageDimensions((prev) => ({
          ...prev,
          [index]: { width: img.width, height: img.height },
        }));
      };
      img.src = image.src;
    });
  }, [images]);

  if (!images || images.length === 0) {
    return <div className="p-4 text-center">No images to display</div>;
  }

  const columns: { src: string; alt: string; index: number }[][] = [[], [], []];
  images.forEach((image, index) => {
    columns[index % 3].push({ ...image, index });
  });

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
        <div className="flex flex-col gap-4">
          <button
            className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
            onClick={onBack}
          >
            <ChevronLeft className="size-6 text-white" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
            onClick={onBack}
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
      <div className="mx-auto flex max-w-6xl gap-2 p-4 pt-16">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-1 flex-col gap-2">
            {column.map(({ src, alt, index }) => {
              const aspectRatio = imageDimensions[index]
                ? imageDimensions[index].height / imageDimensions[index].width
                : 1;
              return (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-lg"
                  style={{ paddingBottom: `${aspectRatio * 100}%` }}
                >
                  <img
                    src={src}
                    alt={alt}
                    className={`absolute left-0 top-0 h-full w-full object-cover transition-opacity duration-300 ${
                      loadedImages.includes(index) ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() => setLoadedImages((prev) => [...prev, index])}
                  />
                  {!loadedImages.includes(index) && (
                    <div className="absolute inset-0 animate-pulse bg-gray-200" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangeModel;
