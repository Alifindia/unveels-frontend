import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { BackSide, Mesh, MeshStandardMaterial, Object3D } from "three";
import { Landmark } from "../../../../types/landmark";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../../utils/calculateDistance";
import { handQuaternion } from "../../../../utils/handOrientation";
import { useAccesories } from "../../../../context/accesories-context";
import { NAILS } from "../../../../utils/constants";
import { useMakeup } from "../../../../context/makeup-context";

interface NailPinkyProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NailPinkyInner: React.FC<NailPinkyProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const nailsRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();
    const { envMapAccesories } = useAccesories();
    const { nailsColor, showNails } = useMakeup();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        NAILS,
        (gltf) => {
          const nails = gltf.scene;
          nails.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.color.set(nailsColor);
                mesh.material.transparent = true;
                mesh.material.visible = showNails;
                mesh.material.opacity = 0.3;
                mesh.material.needsUpdate = true;
              }
              child.renderOrder = 4;
            }
          });

          nailsRef.current = nails;
          scene.add(nails);
          console.log("nails model loaded successfully");
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the nails model: ", error);
        },
      );

      return () => {
        if (nailsRef.current) {
          scene.remove(nailsRef.current);
        }
      };
    }, [scene, envMapAccesories, nailsColor]);

    useFrame(() => {
      if (!handLandmarks.current || !nailsRef.current) return;
      if (handLandmarks.current.length > 0) {
        const thumbBase = handLandmarks.current[1];
        const pinkyBase = handLandmarks.current[17];
    
        const middleFingerPIP = handLandmarks.current[10];
        const middleFingerMCP = handLandmarks.current[9];
        const middleFingerDIP = handLandmarks.current[12];
        const nailsFingerMCP = handLandmarks.current[13];
        const nailsFingerDIP = handLandmarks.current[20];
        const pipToDipDistance = calculateDistance(middleFingerPIP, middleFingerDIP);
        const mcpToPipDistance = calculateDistance(middleFingerMCP, middleFingerPIP);
        const isFingerBent = pipToDipDistance < mcpToPipDistance * 0.8;
    
        const isPalmFacingBack = thumbBase.z > pinkyBase.z;
        const isLeftHand = thumbBase.x > pinkyBase.x;
    
        if (!isPalmFacingBack && !isFingerBent) {
          nailsRef.current.visible = false;
          return;
        }

        nailsRef.current.visible = true;
        const fingerSize = calculateDistance(middleFingerMCP, nailsFingerMCP);
        const nailsFingerZ = 260;
        const scaleFactor = (fingerSize * outputWidth) / 2;
        let nailsFingerX: number;
        let nailsFingerY: number;
  
        if (isPalmFacingBack) {
          if (isLeftHand) {
            nailsFingerX = (1 - nailsFingerDIP.x - 0.494) * outputWidth;
            nailsFingerY = -(nailsFingerDIP.y - 0.5) * outputHeight;
          } else {
            nailsFingerX = (1 - nailsFingerDIP.x - 0.496) * outputWidth;
            nailsFingerY = -(nailsFingerDIP.y - 0.51) * outputHeight;
          }
        } else {
          if (isLeftHand) {
            nailsFingerX = (1 - nailsFingerDIP.x - 0.494) * outputWidth;
            nailsFingerY = -(nailsFingerDIP.y - 0.508) * outputHeight;
          } else {
            nailsFingerX = (1 - nailsFingerDIP.x - 0.495) * outputWidth;
            nailsFingerY = -(nailsFingerDIP.y - 0.515) * outputHeight;
          }
        }
  
        nailsRef.current.position.set(nailsFingerX, nailsFingerY, nailsFingerZ);
  
        const quaternion = handQuaternion(handLandmarks.current, 15, 20);
  
        if (quaternion) {
          nailsRef.current.setRotationFromQuaternion(quaternion);
        }
  
        if (isPalmFacingBack) {
          if (isLeftHand) {
            nailsRef.current.rotation.y += 9.5;
            nailsRef.current.scale.set(scaleFactor * 0.45, scaleFactor * 0.2, scaleFactor * 0.57);
          } else {
            nailsRef.current.rotation.y += 9.38;
            nailsRef.current.scale.set(scaleFactor * 0.45, scaleFactor * 0.2, scaleFactor * 0.65);
          }
        } else if (isFingerBent) {
          if (isLeftHand) {
            nailsRef.current.rotation.y += 0.01;
            nailsRef.current.scale.set(scaleFactor * 0.7, scaleFactor * 0.2, scaleFactor * 0.95);
          } else {
            nailsRef.current.rotation.y += 0.01;
            nailsRef.current.scale.set(scaleFactor * 0.7, scaleFactor * 0.2, scaleFactor * 0.9);
          }
        }

        nailsRef.current.traverse((child) => {
          if ((child as Mesh).isMesh) {
            const mesh = child as Mesh;
            if (mesh.material instanceof MeshStandardMaterial) {
              mesh.material.color.set(nailsColor);
              mesh.material.needsUpdate = true;
            }
          }
        });
      } else {
        nailsRef.current.visible = false;
      }
    });
    
    return null;
  },
);

const NailPinky: React.FC<NailPinkyProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <NailPinkyInner {...props} />
    </Suspense>
  );
};

export default NailPinky;
