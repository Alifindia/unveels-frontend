import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { GLASESS, HAT, HEADBAND } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useAccesories } from "../../../context/accesories-context";
import { calculateDistance } from "../../../utils/calculateDistance";
import { calculateFaceOrientation } from "../../../utils/calculateFaceOrientation";

interface Headbandrops extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const HeadbandInner: React.FC<Headbandrops> = React.memo(
  ({ landmarks, planeSize }) => {
    const headbandRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree(); // Ambil ukuran viewport dan layar
    const { envMapAccesories } = useAccesories();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    const {
      scaleMultiplier,
      topHeadXPosition,
      topHeadYPosition,
      topHeadZPosition,
    } = useMemo(() => {
      if (viewport.width > 1200) {
        return {
          scaleMultiplier: 500,
          topHeadXPosition: 5,
          topHeadYPosition: 25,
          topHeadZPosition: 2,
        };
      }
      return {
        scaleMultiplier: 100,
        topHeadXPosition: 5,
        topHeadYPosition: 25,
        topHeadZPosition: 2,
      };
    }, [viewport.width]);

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        HEADBAND,
        (gltf) => {
          const headband = gltf.scene;
          headband.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.needsUpdate = true;
              }
              child.renderOrder = 2;
            }
          });

          headbandRef.current = headband;
          scene.add(headband);
          console.log("Headband model loaded successfully");
        },
        undefined,
        (error) => {
          console.error(
            "An error occurred loading the Headband model: ",
            error,
          );
        },
      );

      return () => {
        if (headbandRef.current) {
          scene.remove(headbandRef.current);
        }
      };
    }, [scene]);

    useFrame(() => {
      if (!landmarks.current || !headbandRef.current) return;

      const topHead = landmarks.current[10];

      // Scale coordinates proportionally with the viewport
      const scaleX = viewport.width / outputWidth;
      const scaleY = viewport.height / outputHeight;

      const topHeadX =
        (1 - topHead.x) * outputWidth * scaleX - viewport.width / 2;
      const topHeadY = -topHead.y * outputHeight * scaleY + viewport.height / 2;
      const topHeadZ = -topHead.z * 100;

      const faceSize = calculateDistance(
        landmarks.current[162],
        landmarks.current[389],
      );

      // Set position and scale
      headbandRef.current.position.set(
        topHeadX - topHeadXPosition,
        topHeadY - topHeadYPosition,
        topHeadZ - topHeadZPosition,
      );

      const scaleFactor = faceSize * Math.min(scaleX, scaleY) * scaleMultiplier;

      headbandRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

      const quaternion = calculateFaceOrientation(landmarks.current);
      // Set the rotation of the headband object from the final quaternion
      if (quaternion) {
        headbandRef.current.setRotationFromQuaternion(quaternion);
      }
    });

    return null;
  },
);

const Headband: React.FC<Headbandrops> = (props) => {
  return (
    <Suspense fallback={null}>
      <HeadbandInner {...props} />
    </Suspense>
  );
};

export default Headband;
