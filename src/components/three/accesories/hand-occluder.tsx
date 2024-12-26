import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshBasicMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { HAND_OCCLUDER } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { handQuaternion } from "../../../utils/handOrientation";

interface HandOccluderProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const HandOccluderInner: React.FC<HandOccluderProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const occluderRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    const { scaleMultiplier } = useMemo(() => {
      if (viewport.width > 1200) {
        return { scaleMultiplier: 800 };
      }
      return { scaleMultiplier: 220 };
    }, [viewport.width]);

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
                // color: "#FFFF",
                colorWrite: false,
                depthWrite: true,
              });
              mesh.renderOrder = 2;
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
      const wrist = handLandmarks.current[0];
      const thumbBase = handLandmarks.current[1];

      const wristSize = calculateDistance(wrist, thumbBase);

      // Scale coordinates proportionally with the viewport
      const scaleX = viewport.width / outputWidth;
      const scaleY = viewport.height / outputHeight;

      const wristX = (1 - wrist.x) * outputWidth * scaleX - viewport.width / 2;
      const wristY = -wrist.y * outputHeight * scaleY + viewport.height / 2;
      const wristZ = -wrist.z * 100;

      const scaleFactor =
        wristSize * Math.min(scaleX, scaleY) * scaleMultiplier;

      occluderRef.current.position.set(wristX, wristY, wristZ);
      occluderRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

      const quaternion = handQuaternion(handLandmarks.current);

      if (quaternion) {
        occluderRef.current.setRotationFromQuaternion(quaternion);
      }
    });

    return null;
  },
);

const HandOccluder: React.FC<HandOccluderProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <HandOccluderInner {...props} />
    </Suspense>
  );
};

export default HandOccluder;
