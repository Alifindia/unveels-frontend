import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from "three";
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
    
      const wrist = handLandmarks.current[0]; // The wrist landmark
      const thumbBase = handLandmarks.current[1]; // The thumb base (second landmark)
    
      // Check if it's the left hand based on the X position of the wrist
      const isLeftHand = wrist.x > 0.5; // If wrist is on the left side of the screen (adjust as needed)
    
      const wristSize = calculateDistance(wrist, thumbBase);
    
      // Scale coordinates proportionally with the viewport
      const scaleX = viewport.width / outputWidth;
      const scaleY = viewport.height / outputHeight;
    
      const wristX = (1 - wrist.x) * outputWidth * scaleX - viewport.width / 2;
      const wristY = -wrist.y * outputHeight * scaleY + viewport.height / 2;
      const wristZ = -wrist.z * 100; // Scaling for Z, adjust as needed
    
      const scaleFactor = wristSize * Math.min(scaleX, scaleY) * scaleMultiplier;
    
      // New position for the watch
      const newPosition = new Vector3(wristX, wristY, wristZ);
    
      // Set the scale for the watch
      watchRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
      // Calculate the hand's rotation quaternion
      const quaternion = handQuaternion(handLandmarks.current);
    
      if (quaternion) {
        // Flip the quaternion's axes for the left hand
        if (isLeftHand) {
          quaternion.x *= -1; // Flip the X axis
          quaternion.z *= -1; // Flip the Z axis
        }
    
        // Get the current rotation in Euler angles
        const currentRotation = watchRef.current.rotation;
    
        // Convert current rotation to quaternion
        const currentQuaternion = new Quaternion().setFromEuler(currentRotation);
    
        // Smoothly interpolate between current and new quaternion using slerp
        currentQuaternion.slerp(quaternion, 0.1);
    
        // Set the watch's rotation using the interpolated quaternion
        watchRef.current.rotation.setFromQuaternion(currentQuaternion);
      }
    
      // Smoothly interpolate position using lerp
      watchRef.current.position.lerp(newPosition, 0.1);
    
      // Log wrist coordinates for debugging (optional)
      const { x, y, z } = handLandmarks.current[0];
      console.log(x.toPrecision(2), y.toPrecision(2), z.toPrecision(2));
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
