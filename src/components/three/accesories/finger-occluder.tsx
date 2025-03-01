import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { Landmark } from "../../../types/landmark";
import { FINGER_OCCLUDER, HAND_OCCLUDER, NECK_OCCLUDER } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { handQuaternion, ringFingerQuatternion } from "../../../utils/handOrientation";

interface FingerOccluderProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const FingerOccluderInner: React.FC<FingerOccluderProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const occluderRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();
    // Create reusable Vector3 objects to avoid garbage collection
    const positionVector = useMemo(() => new Vector3(), []);

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        FINGER_OCCLUDER,
        (gltf) => {
          const occluder = gltf.scene;
          occluder.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              mesh.material = new MeshBasicMaterial({
                depthTest: true,
                depthWrite: true,
                colorWrite: false,
              });
              mesh.renderOrder = 4;
            }
          });

          occluderRef.current = occluder;
          scene.add(occluder);
          console.log("Occluder model loaded successfully");
        },
        undefined,
        (error) => {
          console.error(
            "An error occurred loading the occluder model: ",
            error,
          );
        },
      );

      return () => {
        if (occluderRef.current) {
          scene.remove(occluderRef.current);
        }
      };
    }, [scene]);

    useFrame(() => {
      if (!occluderRef.current) return;
      if (!handLandmarks.current) {
        occluderRef.current.visible = false;
        return;
      }
      if (handLandmarks.current.length > 0) {
        occluderRef.current.visible = true;
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

        const scaleFactor = (fingerSize * outputWidth) / 6.5;

        occluderRef.current.position.set(screenX, screenY, screenZ);
        occluderRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const quaternion = ringFingerQuatternion(handLandmarks.current);

        if (quaternion) {
          occluderRef.current.setRotationFromQuaternion(quaternion);
        }
      } else {
        occluderRef.current.visible = false;
      }
    });

    return null;
  },
);

const FingerOccluder: React.FC<FingerOccluderProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <FingerOccluderInner {...props} />
    </Suspense>
  );
};

export default FingerOccluder;