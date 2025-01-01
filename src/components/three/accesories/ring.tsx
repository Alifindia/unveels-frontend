import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { handQuaternion } from "../../../utils/handOrientation";
import { useAccesories } from "../../../context/accesories-context";
import { RING } from "../../../utils/constants";

interface RingProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const RingInner: React.FC<RingProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const ringRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();
    const { envMapAccesories, showRing } = useAccesories();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

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
                mesh.material.visible = showRing;
              }
              child.renderOrder = 4;
            }
          });

          ringRef.current = ring;
          scene.add(ring);
          console.log("ring model loaded successfully");
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the ring model: ", error);
        },
      );

      return () => {
        if (ringRef.current) {
          scene.remove(ringRef.current);
        }
      };
    }, [scene]);

    useFrame(() => {
      if (!handLandmarks.current || !ringRef.current) return;
      if (handLandmarks.current.length > 0) {
        ringRef.current.visible = true;

        const middleFingerMCP = handLandmarks.current[9];
        const ringFingerMCP = handLandmarks.current[13];
        const ringFingerDIP = handLandmarks.current[14];

        const fingerSize = calculateDistance(middleFingerMCP, ringFingerMCP);

        const ringFingerX = (1 - ringFingerDIP.x - 0.5) * outputWidth;
        const ringFingerY = -(ringFingerDIP.y - 0.5) * outputHeight;
        const ringFingerZ = 200;

        const scaleFactor = (fingerSize * outputWidth) / 6;

        ringRef.current.position.set(ringFingerX, ringFingerY, ringFingerZ);
        ringRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const quaternion = handQuaternion(handLandmarks.current);

        if (quaternion) {
          ringRef.current.setRotationFromQuaternion(quaternion);
        }
      } else {
        ringRef.current.visible = false;
      }
    });

    return null;
  },
);

const Ring: React.FC<RingProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <RingInner {...props} />
    </Suspense>
  );
};

export default Ring;
