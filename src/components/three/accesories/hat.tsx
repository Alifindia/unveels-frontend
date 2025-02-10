import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { HAT } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useAccesories } from "../../../context/accesories-context";
import { calculateDistance } from "../../../utils/calculateDistance";
import { calculateFaceOrientation } from "../../../utils/calculateFaceOrientation";

interface Hatrops extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const HatInner: React.FC<Hatrops> = React.memo(({ landmarks, planeSize }) => {
  const hatRef = useRef<Object3D | null>(null);
  const { scene, viewport } = useThree(); // Ambil ukuran viewport dan layar
  const { envMapAccesories, showHat } = useAccesories();

  const outputWidth = planeSize[0];
  const outputHeight = planeSize[1];

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      HAT,
      (gltf) => {
        const hat = gltf.scene;
        hat.traverse((child) => {
          if ((child as Mesh).isMesh) {
            const mesh = child as Mesh;
            if (mesh.material instanceof MeshStandardMaterial) {
              mesh.material.envMap = envMapAccesories;
              mesh.material.needsUpdate = true;
              mesh.material.visible = showHat;
            }
            child.renderOrder = 2;
          }
        });

        hatRef.current = hat;
        scene.add(hat);
        console.log("Hat model loaded successfully");
      },
      undefined,
      (error) => {
        console.error("An error occurred loading the Hat model: ", error);
      },
    );

    return () => {
      if (hatRef.current) {
        scene.remove(hatRef.current);
      }
    };
  }, [scene]);

  useFrame(() => {
    if (!hatRef.current) return;
    if (!landmarks.current) {
      hatRef.current.visible = false;
      return;
    }
    if (landmarks.current.length > 0) {
      hatRef.current.visible = true;
      const topHead = landmarks.current[10];

      const topHeadX = (1 - topHead.x - 0.5) * outputWidth;
      const topHeadY = -(topHead.y - 0.5) * outputHeight;
      const topHeadZ = -topHead.z * Math.max(outputHeight, outputWidth);

      const faceSize = calculateDistance(
        landmarks.current[162],
        landmarks.current[389],
      );

      // Set position and scale
      hatRef.current.position.set(topHeadX, topHeadY, topHeadZ);

      const scaleFactor = (faceSize * outputWidth) / 6;

      hatRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

      const quaternion = calculateFaceOrientation(landmarks.current);
      // Set the rotation of the hat object from the final quaternion
      if (quaternion) {
        hatRef.current.setRotationFromQuaternion(quaternion);
      }
    } else {
      hatRef.current.visible = false;
    }
  });

  return null;
});

const Hat: React.FC<Hatrops> = (props) => {
  return (
    <Suspense fallback={null}>
      <HatInner {...props} />
    </Suspense>
  );
};

export default Hat;
