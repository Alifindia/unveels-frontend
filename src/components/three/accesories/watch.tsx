import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import {
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from "three";
import { Landmark } from "../../../types/landmark";
import { WATCH } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { handQuaternion } from "../../../utils/handOrientation";
import { useAccesories } from "../../../context/accesories-context";

interface WatchProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const WatchInner: React.FC<WatchProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const watchRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();
    const { envMapAccesories } = useAccesories();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    const { scaleMultiplier } = useMemo(() => {
      if (viewport.width > 1200) {
        return { scaleMultiplier: 800 };
      }
      return { scaleMultiplier: 250 };
    }, [viewport.width]);

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        WATCH,
        (gltf) => {
          const watch = gltf.scene;
          watch.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.needsUpdate = true;
              }
              child.renderOrder = 2;
            }
          });

          watchRef.current = watch;
          scene.add(watch);
          console.log("watch model loaded successfully");
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the watch model: ", error);
        },
      );

      return () => {
        if (watchRef.current) {
          scene.remove(watchRef.current);
        }
      };
    }, [scene]);

    useFrame(() => {
      if (!handLandmarks.current || !watchRef.current) return;
      const wrist = handLandmarks.current[0];
      const thumbBase = handLandmarks.current[1];

      const wristSize = calculateDistance(wrist, thumbBase);
      const wristX = (1 - wrist.x - 0.5) * outputWidth;
      const wristY = -(wrist.y - 0.5) * outputHeight;
      const wristZ = -wrist.z * 100;

      const scaleFactor = wristSize * outputWidth / 3;

      watchRef.current.position.set(wristX, wristY, wristZ);
      watchRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

      const quaternion = handQuaternion(handLandmarks.current);

      if (quaternion) {
        watchRef.current.setRotationFromQuaternion(quaternion);
      }
    });

    return null;
  },
);

const Watch: React.FC<WatchProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <WatchInner {...props} />
    </Suspense>
  );
};

export default Watch;
