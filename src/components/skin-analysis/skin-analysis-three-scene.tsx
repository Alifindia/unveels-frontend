import React, { useEffect, useRef, useMemo, useState } from "react";
import { Canvas, MeshProps, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import FaceMesh from "../three/face-mesh";
import { Landmark } from "../../types/landmark";
import { BilateralFilterShader } from "../../shaders/BilateralFilterShader";
import { DoubleSide } from "three";
import { computeConvexHull } from "../../utils/imageProcessing";
import Wrinkles from "../three/face/wrinkles";
import Eyebag from "../three/face/eyebag";
import Droppy from "../three/face/droppy";
import DarkCircle from "../three/face/dark-circle";
import Dry from "../three/face/dry";
import Firmness from "../three/face/firmness";
import Moistures from "../three/face/moistures";
import Oily from "../three/face/oily";
import Redness from "../three/face/redness";
import { sRGBEncoding } from "@react-three/drei/helpers/deprecated";
import Radiance from "../three/face/radiance";

// Komponen untuk menampilkan gambar menggunakan React Three Fiber
interface SkinAnalysisThreeSceneProps extends MeshProps {
  imageSrc: string;
  landmarks: Landmark[];
  landmarksRef: React.RefObject<Landmark[]>;
}

const SkinAnalysisThreeScene: React.FC<SkinAnalysisThreeSceneProps> = ({
  imageSrc,
  landmarks,
  landmarksRef,
  ...props
}) => {
  const texture = useTexture(imageSrc);
  const { viewport } = useThree();
  const [loadedStages, setLoadedStages] = useState<number>(0); // Track stages loaded

  // State untuk ukuran window dan DPR
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
    dpr: number;
  }>({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  });

  // Handle window resize dengan debounce
  useEffect(() => {
    const debounce = (func: () => void, delay: number) => {
      let timer: NodeJS.Timeout;
      return () => {
        clearTimeout(timer);
        timer = setTimeout(func, delay);
      };
    };

    const handleResize = debounce(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      });
    }, 200);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Perhitungan ukuran plane menggunakan useMemo
  const planeSize = useMemo(() => {
    if (!texture.image) return [1, 1];

    const imageAspect = texture.image.width / texture.image.height;
    const viewportAspect = viewport.width / viewport.height;

    if (imageAspect > viewportAspect) {
      return [viewport.height * imageAspect, viewport.height];
    } else {
      return [viewport.width, viewport.width / imageAspect];
    }
  }, [texture, viewport]);

  // Load stages incrementally
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadedStages((prev) => Math.min(prev + 1, 9)); // Increment stage
    }, 500); // Adjust delay as needed
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {texture && (
        <mesh position={[0, 0, -10]} scale={[-1, 1, 1]} {...props}>
          <planeGeometry args={[planeSize[0], planeSize[1]]} />
          <meshBasicMaterial map={texture} side={DoubleSide} />
        </mesh>
      )}

      {loadedStages > 0 && (
        <Wrinkles
          landmarks={landmarksRef}
          planeSize={[planeSize[0], planeSize[1]]}
        />
      )}
      {loadedStages > 1 && (
        <Eyebag
          landmarks={landmarksRef}
          planeSize={[planeSize[0], planeSize[1]]}
        />
      )}
      {loadedStages > 2 && (
        <Droppy
          landmarks={landmarksRef}
          planeSize={[planeSize[0], planeSize[1]]}
        />
      )}
      {loadedStages > 3 && (
        <DarkCircle
          landmarks={landmarksRef}
          planeSize={[planeSize[0], planeSize[1]]}
        />
      )}
      {loadedStages > 4 && (
        <Dry landmarks={landmarksRef} planeSize={[planeSize[0], planeSize[1]]} />
      )}
      {loadedStages > 5 && (
        <Firmness
          landmarks={landmarksRef}
          planeSize={[planeSize[0], planeSize[1]]}
        />
      )}
      {loadedStages > 6 && (
        <Moistures
          landmarks={landmarksRef}
          planeSize={[planeSize[0], planeSize[1]]}
        />
      )}
      {loadedStages > 7 && (
        <Oily landmarks={landmarksRef} planeSize={[planeSize[0], planeSize[1]]} />
      )}
      {loadedStages > 8 && (
        <Redness
          landmarks={landmarksRef}
          planeSize={[planeSize[0], planeSize[1]]}
        />
      )}
    </>
  );
};

export default SkinAnalysisThreeScene;
