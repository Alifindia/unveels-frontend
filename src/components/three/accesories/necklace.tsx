import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { NECKLACE } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { useAccesories } from "../../../context/accesories-context";
import { calculateFaceOrientation } from "../../../utils/calculateFaceOrientation";

interface NecklaceProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NecklaceInner: React.FC<NecklaceProps> = React.memo(
  ({ landmarks, planeSize }) => {
    const necklaceRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();
    const { envMapAccesories, showNecklace } = useAccesories();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

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
                mesh.material.visible = showNecklace;
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
      if (landmarks.current.length > 0) {
        necklaceRef.current.visible = true;
        const neckLandmark = landmarks.current[152];

        const neckDistance =
          calculateDistance(landmarks.current[197], landmarks.current[152]) *
          outputWidth *
          1.5;

        const neckLandmarkX = (1 - neckLandmark.x - 0.49) * outputWidth;
        const neckLandmarkY = -(neckLandmark.y - 0.62) * outputHeight;
        const neckLandmarkZ = -neckLandmark.z * 200;

        const faceSize = calculateDistance(
          landmarks.current[162],
          landmarks.current[389],
        );

        const scaleFactor = (faceSize * outputWidth) / 15;

        if (neckLandmark) {
          necklaceRef.current.position.set(
            neckLandmarkX,
            neckLandmarkY - (neckDistance * 0.9),
            neckLandmarkZ,
          );

          const quaternion = calculateFaceOrientation(landmarks.current);

          if (quaternion) {
            necklaceRef.current.setRotationFromQuaternion(quaternion);
          }

          necklaceRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
          necklaceRef.current.translateZ(-(scaleFactor * 10));
          necklaceRef.current.rotation.y = 0;
          necklaceRef.current.rotation.z = 0;
          necklaceRef.current.rotation.x = 0;
        }
      } else {
        necklaceRef.current.visible = false;
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
