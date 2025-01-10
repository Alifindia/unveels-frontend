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

interface NailThumbProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NailThumbInner: React.FC<NailThumbProps> = React.memo(
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
                mesh.material.visible = showNails;
                mesh.material.transparent = true;
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
        const middleFingerMCP = handLandmarks.current[9];
        const middleFingerPIP = handLandmarks.current[10];
        const middleFingerDIP = handLandmarks.current[12];
        const nailsFingerMCP = handLandmarks.current[13];
        const nailsFingerDIP = handLandmarks.current[4];
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
        const nailsFingerZ = 200;
        const scaleFactor = (fingerSize * outputWidth) / 2.4;
        let nailsFingerX: number;
        let nailsFingerY: number;
  
        if (isPalmFacingBack) {
          if (isLeftHand) {
            nailsFingerX = (1 - nailsFingerDIP.x - 0.504) * outputWidth;
            nailsFingerY = -(nailsFingerDIP.y - 0.512) * outputHeight;
          } else {
            nailsFingerX = (1 - nailsFingerDIP.x - 0.495) * outputWidth;
            nailsFingerY = -(nailsFingerDIP.y - 0.502) * outputHeight;
          }
        } else {
          if (isLeftHand) {
            nailsFingerX = (1 - nailsFingerDIP.x - 0.51) * outputWidth;
            nailsFingerY = -(nailsFingerDIP.y - 0.51) * outputHeight;
          } else {
            nailsFingerX = (1 - nailsFingerDIP.x - 0.495) * outputWidth;
            nailsFingerY = -(nailsFingerDIP.y - 0.51) * outputHeight;
          }
        }

        nailsRef.current.position.set(nailsFingerX, nailsFingerY, nailsFingerZ);
        const quaternion = handQuaternion(handLandmarks.current, 1, 5);

        if (quaternion) {
          nailsRef.current.setRotationFromQuaternion(quaternion);
        }
  
        if (isPalmFacingBack) {
          if (isLeftHand) {
            nailsRef.current.rotation.y += 9.3;
            nailsRef.current.scale.set( scaleFactor * 0.75, scaleFactor * 2, scaleFactor * 0.9);
          } else {
            nailsRef.current.rotation.y += 9.8;
            nailsRef.current.scale.set( scaleFactor * 0.75, scaleFactor * 2, scaleFactor * 1);
          }
        } else if (isFingerBent) {
          if (isLeftHand) {
            nailsRef.current.rotation.y -= 1.6;
            nailsRef.current.scale.set(scaleFactor * 0.6, scaleFactor * 2, scaleFactor * 1.4);
          } else {
            nailsRef.current.rotation.y += 1.5;
            nailsRef.current.scale.set(scaleFactor * 0.6, scaleFactor * 2, scaleFactor * 1.4);
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

const NailThumb: React.FC<NailThumbProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <NailThumbInner {...props} />
    </Suspense>
  );
};

export default NailThumb;
