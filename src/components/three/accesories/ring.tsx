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
      const middleFingerMCP = handLandmarks.current[9];
      const ringFingerMCP = handLandmarks.current[13];
      const ringFingerDIP = handLandmarks.current[14];

      const fingerSize = calculateDistance(middleFingerMCP, ringFingerMCP);

      // Scale coordinates proportionally with the viewport
      const scaleX = viewport.width / outputWidth;
      const scaleY = viewport.height / outputHeight;

      const ringFingerX =
        (1 - ringFingerDIP.x) * outputWidth * scaleX - viewport.width / 2;
      const ringFingerY =
        -ringFingerDIP.y * outputHeight * scaleY + viewport.height / 2;
      const ringFingerZ = -ringFingerDIP.z * 100;

      const scaleFactor =
        fingerSize * Math.min(scaleX, scaleY) * scaleMultiplier;

      ringRef.current.position.set(ringFingerX, ringFingerY, ringFingerZ);
      ringRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

      const quaternion = handQuaternion(handLandmarks.current);

      if (quaternion) {
        ringRef.current.setRotationFromQuaternion(quaternion);
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
