import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import {
  BackSide,
  FrontSide,
  Mesh,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { Landmark } from "../../../../types/landmark";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../../utils/calculateDistance";
import { handQuaternion } from "../../../../utils/handOrientation";
import { useAccesories } from "../../../../context/accesories-context";
import { NAILS } from "../../../../utils/constants";
import { useMakeup } from "../../../../context/makeup-context";

interface NailMidlleProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NailMidlleInner: React.FC<NailMidlleProps> = React.memo(
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
                mesh.material.color.set(nailsColor); // Set initial color
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
        const middleFingerPIP = handLandmarks.current[10];
        const middleFingerMCP = handLandmarks.current[9];
        const middleFingerDIP = handLandmarks.current[12];
        const nailsFingerMCP = handLandmarks.current[13];
    
        // Calculate distances to detect bending
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
        const scaleFactor = (fingerSize * outputWidth) / 1.5;
    
        let nailsFingerX: number;
        let nailsFingerY: number;
    
        if (isPalmFacingBack) {
          if (isLeftHand) {
            nailsFingerX = (1 - middleFingerDIP.x - 0.494) * outputWidth;
            nailsFingerY = -(middleFingerDIP.y - 0.509) * outputHeight;
          } else {
            nailsFingerX = (1 - middleFingerDIP.x - 0.496) * outputWidth;
            nailsFingerY = -(middleFingerDIP.y - 0.506) * outputHeight;
          }
        } else {
          if (isLeftHand) {
            nailsFingerX = (1 - middleFingerDIP.x - 0.49) * outputWidth;
            nailsFingerY = -(middleFingerDIP.y - 0.522) * outputHeight;
          } else {
            nailsFingerX = (1 - middleFingerDIP.x - 0.495) * outputWidth;
            nailsFingerY = -(middleFingerDIP.y - 0.512) * outputHeight;
          }
        }
    
        nailsRef.current.position.set(nailsFingerX, nailsFingerY, nailsFingerZ);
    
        const quaternion = handQuaternion(handLandmarks.current, 15, 12);
    
        if (quaternion) {
          nailsRef.current.setRotationFromQuaternion(quaternion);
        }
    
        if (isPalmFacingBack) {
          if (isLeftHand) {
            nailsRef.current.rotation.y += 9.6;
            nailsRef.current.scale.set(scaleFactor * 0.47, scaleFactor, scaleFactor * 0.5);
          } else {
            nailsRef.current.rotation.y += 9.2;
            nailsRef.current.scale.set(scaleFactor * 0.49, scaleFactor, scaleFactor * 0.52);
          }
        } else if (isFingerBent) {
          if (isLeftHand) {
            nailsRef.current.rotation.y += 0.23;
            nailsRef.current.scale.set(scaleFactor * 0.7, scaleFactor, scaleFactor * 0.9);  
          } else {
            nailsRef.current.rotation.y -= 0.18;
            nailsRef.current.scale.set(scaleFactor * 0.7, scaleFactor, scaleFactor * 0.9);
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

const NailMidlle: React.FC<NailMidlleProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <NailMidlleInner {...props} />
    </Suspense>
  );
};

export default NailMidlle;
