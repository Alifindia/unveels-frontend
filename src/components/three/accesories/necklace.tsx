import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { NECKLACE } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { useAccesories } from "../../../context/accesories-context";

interface NecklaceProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NecklaceInner: React.FC<NecklaceProps> = React.memo(
  ({ landmarks, planeSize }) => {
    const necklaceRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();
    const { envMapAccesories } = useAccesories();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    const { scaleMultiplier, neckDistanceY } = useMemo(() => {
      if (viewport.width > 1200) {
        return { scaleMultiplier: 300, neckDistanceY: 1000 };
      }
      return { scaleMultiplier: 60, neckDistanceY: 50 };
    }, [viewport.width]);

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        NECKLACE,
        (gltf) => {
          const necklace = gltf.scene;
          necklace.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.needsUpdate = true;
              }
              child.renderOrder = 2;
            }
          });

          necklaceRef.current = necklace;
          scene.add(necklace);
          console.log("necklace model loaded successfully");
        },
        undefined,
        (error) => {
          console.error(
            "An error occurred loading the necklace model: ",
            error,
          );
        },
      );

      return () => {
        if (necklaceRef.current) {
          scene.remove(necklaceRef.current);
        }
      };
    }, [scene]);

    useFrame(() => {
      if (!landmarks.current || !necklaceRef.current) return;

      const neckLandmark = landmarks.current[0];

      const neckDistance =
        calculateDistance(landmarks.current[197], landmarks.current[152]) * 800;

      // Scale coordinates proportionally with the viewport
      const scaleX = viewport.width / outputWidth;
      const scaleY = viewport.height / outputHeight;

      const neckLandmarkX =
        (1 - neckLandmark.x) * outputWidth * scaleX - viewport.width / 2;
      const neckLandmarkY =
        -neckLandmark.y * outputHeight * scaleY + viewport.height / 2;
      const neckLandmarkZ = -neckLandmark.z * 100;

      const faceSize = calculateDistance(
        landmarks.current[162],
        landmarks.current[389],
      );

      const scaleFactor = faceSize * Math.min(scaleX, scaleY) * scaleMultiplier;

      if (neckLandmark) {
        necklaceRef.current.position.set(
          (neckLandmarkX / 6) * 2,
          neckLandmarkY - neckDistance - neckDistanceY,
          0,
        );

        necklaceRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
      }
    });

    return null;
  },
);

const Necklace: React.FC<NecklaceProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <NecklaceInner {...props} />
    </Suspense>
  );
};

export default Necklace;
