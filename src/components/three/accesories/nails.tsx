import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { handQuaternion } from "../../../utils/handOrientation";
import { useAccesories } from "../../../context/accesories-context";
import { RING } from "../../../utils/constants";

interface NailsProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NailsInner: React.FC<NailsProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const nailsRefs = useRef<Object3D[]>([]);
    const { scene, viewport } = useThree();
    const { envMapAccesories } = useAccesories();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    const { scaleMultiplier } = useMemo(() => {
      if (viewport.width > 1200) {
        return { scaleMultiplier: 500 };
      }
      return { scaleMultiplier: 200 };
    }, [viewport.width]);

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        RING,
        (gltf) => {
          const ring = gltf.scene;
          ring.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.needsUpdate = true;
              }
              child.renderOrder = 2;
            }
          });

          // Clone the ring object for each finger (5 total)
          for (let i = 0; i < 5; i++) {
            const ringClone = ring.clone();
            nailsRefs.current.push(ringClone);
            scene.add(ringClone);
          }

          console.log("ring model loaded successfully");
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the ring model: ", error);
        },
      );

      return () => {
        nailsRefs.current.forEach((nailRef) => {
          scene.remove(nailRef);
        });
      };
    }, [scene]);

    useFrame(() => {
      if (!handLandmarks.current || nailsRefs.current.length < 5) return;

      const fingersLandmarks = [
        handLandmarks.current[4], // Thumb
        handLandmarks.current[8], // Index
        handLandmarks.current[12], // Middle
        handLandmarks.current[16], // Ring
        handLandmarks.current[20], // Pinky
      ];

      fingersLandmarks.forEach((landmark, index) => {
        const nailRef = nailsRefs.current[index];

        if (!nailRef) return;

        const scaleX = viewport.width / outputWidth;
        const scaleY = viewport.height / outputHeight;

        const nailX =
          (1 - landmark.x) * outputWidth * scaleX - viewport.width / 2;
        const nailY = -landmark.y * outputHeight * scaleY + viewport.height / 2;
        const nailZ = -landmark.z * 100;

        const fingerSize = calculateDistance(
          handLandmarks.current[9], // Using the middle finger MCP as a reference
          handLandmarks.current[13],
        );

        const scaleFactor =
          fingerSize * Math.min(scaleX, scaleY) * scaleMultiplier;

        nailRef.position.set(nailX, nailY, nailZ);
        nailRef.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const quaternion = handQuaternion(handLandmarks.current);

        if (quaternion) {
          nailRef.setRotationFromQuaternion(quaternion);
        }
      });
    });

    return null;
  },
);

const Nails: React.FC<NailsProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <NailsInner {...props} />
    </Suspense>
  );
};

export default Nails;
