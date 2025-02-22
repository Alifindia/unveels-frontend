import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { GLASESS, HAT } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useAccesories } from "../../../context/accesories-context";
import { calculateDistance } from "../../../utils/calculateDistance";
import { calculateFaceOrientation } from "../../../utils/calculateFaceOrientation";

interface Glasessrops extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const GlasessInner: React.FC<Glasessrops> = React.memo(
  ({ landmarks, planeSize }) => {
    const glasessRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree(); // Ambil ukuran viewport dan layar
    const { envMapAccesories, showGlasess } = useAccesories();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        GLASESS,
        (gltf) => {
          const glasess = gltf.scene;
          glasess.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.needsUpdate = true;
                mesh.material.visible = showGlasess;
              }
              child.renderOrder = 2;
            }
          });

          glasessRef.current = glasess;
          scene.add(glasess);
          console.log("Glasess model loaded successfully");
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the Glasess model: ", error);
        },
      );

      return () => {
        if (glasessRef.current) {
          scene.remove(glasessRef.current);
        }
      };
    }, [scene]);

    useFrame(() => {
      if (!glasessRef.current) return;
      if (!landmarks.current) {
        glasessRef.current.visible = false;
        return;
      }
      if (landmarks.current.length > 0) {
        glasessRef.current.visible = true;
        const centerEye = landmarks.current[168];

        const centerEyeX = (1 - centerEye.x - 0.5) * outputWidth;
        const centerEyeY = -(centerEye.y - 0.5) * outputHeight;
        const centerEyeZ = -centerEye.z * Math.max(outputHeight, outputWidth);

        const faceSize = calculateDistance(
          landmarks.current[162],
          landmarks.current[389],
        );

        // Set position and scale
        glasessRef.current.position.set(centerEyeX, centerEyeY, centerEyeZ);

        const scaleFactor = (faceSize * outputWidth) / 5;

        glasessRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const quaternion = calculateFaceOrientation(landmarks.current);
        // Set the rotation of the glasess object from the final quaternion
        if (quaternion) {
          glasessRef.current.setRotationFromQuaternion(quaternion);
        }
      } else {
        glasessRef.current.visible = false;
      }
    });

    return null;
  },
);

const Glasess: React.FC<Glasessrops> = (props) => {
  return (
    <Suspense fallback={null}>
      <GlasessInner {...props} />
    </Suspense>
  );
};

export default Glasess;
