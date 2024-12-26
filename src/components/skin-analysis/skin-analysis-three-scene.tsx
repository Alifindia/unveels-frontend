import React, { useEffect, useRef, useMemo, useState } from "react";
import { Canvas, MeshProps, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import FaceMesh from "../three/face-mesh";
import { Landmark } from "../../types/landmark";
import { BilateralFilterShader } from "../../shaders/BilateralFilterShader";
import {
  Vector2,
  ShaderMaterial,
  LinearFilter,
  CanvasTexture,
  RGBFormat,
  DoubleSide,
  RedFormat,
} from "three";
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
  const [planeSize, setPlaneSize] = useState<[number, number]>([1, 1]);

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

    setPlaneSize([planeWidth, planeHeight]);
  }, [texture, viewport]);

  return (
    <>
      {texture && (
        <mesh position={[0, 0, -10]} scale={[-1, 1, 1]} {...props}>
          <planeGeometry args={[planeSize[0], planeSize[1]]} />
          <meshBasicMaterial map={texture} side={DoubleSide} />
        </mesh>
      )}

      <Wrinkles
        landmarks={landmarksRef}
        planeSize={[planeSize[0], planeSize[1]]}
      />
      <Eyebag
        landmarks={landmarksRef}
        planeSize={[planeSize[0], planeSize[1]]}
      />
      <Droppy
        landmarks={landmarksRef}
        planeSize={[planeSize[0], planeSize[1]]}
      />
      <DarkCircle
        landmarks={landmarksRef}
        planeSize={[planeSize[0], planeSize[1]]}
      />
      <Dry landmarks={landmarksRef} planeSize={[planeSize[0], planeSize[1]]} />
      <Firmness
        landmarks={landmarksRef}
        planeSize={[planeSize[0], planeSize[1]]}
      />
      <Moistures
        landmarks={landmarksRef}
        planeSize={[planeSize[0], planeSize[1]]}
      />
      <Oily landmarks={landmarksRef} planeSize={[planeSize[0], planeSize[1]]} />
      <Redness
        landmarks={landmarksRef}
        planeSize={[planeSize[0], planeSize[1]]}
      />
    </>
  );
};

export default SkinAnalysisThreeScene;
