import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { BufferGeometry, Line, LineBasicMaterial, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { Landmark } from "../../../types/landmark";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { handQuaternion, ringFingerQuatternion } from "../../../utils/handOrientation";
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
      console.log(RING)
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
              child.renderOrder = 5;
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
      if (!ringRef.current) return;
      if (!handLandmarks.current) {
        ringRef.current.visible = false;
        return;
      }
      if (handLandmarks.current.length > 0) {
        ringRef.current.visible = true;
        const middleFingerMCP = handLandmarks.current[9];
        const ringFingerMCP = handLandmarks.current[13];
        const ringFingerPIP = handLandmarks.current[14];

        const fingerSize = calculateDistance(middleFingerMCP, ringFingerMCP);

        const lerpFactor = 0.6;

        const x = ringFingerMCP.x + (ringFingerPIP.x - ringFingerMCP.x) * lerpFactor;
        const y = ringFingerMCP.y + (ringFingerPIP.y - ringFingerMCP.y) * lerpFactor;
        const z = ringFingerMCP.z + (ringFingerPIP.z - ringFingerMCP.z) * lerpFactor;

        const screenX = (1 - x - 0.5) * outputWidth;
        const screenY = -(y - 0.5) * outputHeight;
        const screenZ = -z * outputWidth;

        const scaleFactor = (fingerSize * outputWidth);
        ringRef.current.position.set(screenX, screenY, screenZ);
        ringRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const quaternion = ringFingerQuatternion(handLandmarks.current);

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
