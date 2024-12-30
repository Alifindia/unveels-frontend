import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshBasicMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { HAND_OCCLUDER } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { handQuaternion } from "../../../utils/handOrientation";

interface FingerOccluderProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const FingerOccluderInner: React.FC<FingerOccluderProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const occluderRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        HAND_OCCLUDER,
        (gltf) => {
          const occluder = gltf.scene;
          occluder.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              mesh.material = new MeshBasicMaterial({
                depthTest: true,
                depthWrite: true,
                colorWrite: false, // Ubah ini jika sudah yakin occluder muncul
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
      if (!handLandmarks.current || !occluderRef.current) return;
      if (handLandmarks.current.length > 0) {
        occluderRef.current.visible = true;
        const middleFingerMCP = handLandmarks.current[9];
        const ringFingerMCP = handLandmarks.current[13];
        const ringFingerDIP = handLandmarks.current[14];

        const fingerSize = calculateDistance(middleFingerMCP, ringFingerMCP);

        const ringFingerX = (1 - ringFingerDIP.x - 0.5) * outputWidth;
        const ringFingerY = -(ringFingerDIP.y - 0.5) * outputHeight;
        const ringFingerZ = 200;

        const scaleFactor = (fingerSize * outputWidth) / 6.5;

        occluderRef.current.position.set(ringFingerX, ringFingerY, ringFingerZ);
        occluderRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const quaternion = handQuaternion(handLandmarks.current);

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
