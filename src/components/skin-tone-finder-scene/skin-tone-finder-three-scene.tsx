import { useEffect, useImperativeHandle, useState } from "react";
import { MeshProps, useThree } from "@react-three/fiber";
import { Landmark } from "../../types/landmark";
import { useTexture } from "@react-three/drei";
import Foundation from "../three/makeup/foundation";
import { LinearFilter, RGBFormat } from "three";
import { useCamera } from "../../context/recorder-context";
import { useMakeup } from "../../context/makeup-context";
import FoundationSTF from "../three/makeup/foundation-stf";

interface SkinToneFinderThreeSceneProps extends MeshProps {
  imageSrc: string;
  landmarks: React.RefObject<Landmark[]>;
}

const SkinToneFinderThreeScene: React.FC<SkinToneFinderThreeSceneProps> = ({
  imageSrc,
  landmarks,
  ...props
}) => {
  const { gl } = useThree();
  const { skinToneThreeSceneRef, setScreenshotImage } = useCamera();
  const texture = useTexture(imageSrc);
  const { viewport } = useThree();
  const [planeSize, setPlaneSize] = useState<[number, number]>([1, 1]);
  const { foundationColor } = useMakeup();

  // State for window size and DPR
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
    dpr: number;
  }>({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  });

  // Handle window resize to update windowSize state
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate plane size based on image aspect ratio and viewport
  useEffect(() => {
    if (!texture.image) return;

    const imageAspect = texture.image.width / texture.image.height;
    const viewportAspect = viewport.width / viewport.height;

    let planeWidth: number;
    let planeHeight: number;

    if (imageAspect > viewportAspect) {
      // Image is wider than viewport
      planeHeight = viewport.height;
      planeWidth = viewport.height * imageAspect;
    } else {
      // Image is taller or same aspect as viewport
      planeWidth = viewport.width;
      planeHeight = viewport.width / imageAspect;
    }

    texture.format = RGBFormat;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    setPlaneSize([planeWidth, planeHeight]);
  }, [texture, viewport]);
  1;

  // Take screenshoot
  const handleScreenshot = () => {
    requestAnimationFrame(() => {
      const canvas = gl.domElement as HTMLCanvasElement;
      console.log(canvas);
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            if ((window as any).flutter_inappwebview) {
              const reader = new FileReader();
              reader.onload = function () {
                const base64Image = reader.result as string;
                const resultString = JSON.stringify(base64Image);
                console.log("Scrrenshot as Base64:", resultString);

                (window as any).flutter_inappwebview
                  .callHandler("screenshotResult", resultString)
                  .then((result: any) => {
                    console.log("Flutter responded with:", result);
                  })
                  .catch((error: any) => {
                    console.error("Error calling Flutter handler:", error);
                  });
              };
            } else {
              setScreenshotImage(imageUrl);
            }
          }
        });
      }
    });
  };

  useImperativeHandle(skinToneThreeSceneRef, () => ({
    callFunction: handleScreenshot,
  }));

  return (
    <>
      {/* <mesh position={[0, 0, -10]} scale={[-1, 1, 1]} {...props}>
        <planeGeometry args={[planeSize[0], planeSize[1]]} />
        <meshBasicMaterial map={texture} />
      </mesh> */}

      {/* {foundationColor != "" && (
        <FoundationSTF
          planeSize={planeSize}
          landmarks={landmarks}
          isFlipped={true}
        />
      )} */}
    </>
  );
};

export default SkinToneFinderThreeScene;
