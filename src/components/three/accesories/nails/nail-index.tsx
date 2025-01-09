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

interface NailIndexProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NailIndexInner: React.FC<NailIndexProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const nailsRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();
    const { envMapAccesories } = useAccesories();
    const { nailsColor } = useMakeup();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        NAILS,
        (gltf) => {
          const ring = gltf.scene;
          ring.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.color.set(nailsColor); // Set initial color
                mesh.material.side = BackSide;
                mesh.material.transparent = true;
                mesh.material.opacity = 0.3;
                mesh.material.needsUpdate = true;
              }
              child.renderOrder = 4;
            }
          });

          nailsRef.current = ring;
          scene.add(ring);
          console.log("Ring model loaded successfully");
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the ring model: ", error);
        },
      );

      return () => {
        if (nailsRef.current) {
          scene.remove(nailsRef.current);
        }
      };
    }, [scene, envMapAccesories, nailsColor]); // Adding nailsColor to the dependency array

    useFrame(() => {
      if (!handLandmarks.current || !nailsRef.current) return;
    
      if (handLandmarks.current.length > 0) {
        const thumbBase = handLandmarks.current[1]; // Pangkal ibu jari
        const pinkyBase = handLandmarks.current[17]; // Pangkal jari kelingking
        const middleFingerMCP = handLandmarks.current[9];
        const nailsFingerMCP = handLandmarks.current[13];
        const nailsFingerDIP = handLandmarks.current[8];
        const middleFingerPIP = handLandmarks.current[10];
        
        const isPalmFacingBack = thumbBase.z > pinkyBase.z;
        const isLeftHand = thumbBase.x > pinkyBase.x; // Check if it’s the left hand
        
        // Calculate distances to detect bending
        const pipToDipDistance = calculateDistance(middleFingerPIP, nailsFingerDIP);
        const mcpToPipDistance = calculateDistance(middleFingerMCP, middleFingerPIP);
        const isFingerBent = pipToDipDistance < mcpToPipDistance * 0.8; // Example threshold for bending
    
        console.log(`Telapak tangan menghadap ${isPalmFacingBack ? "belakang" : "depan"}`);
    
        // Apply condition for visibility
        if (isLeftHand && !isPalmFacingBack && !isFingerBent) {
          nailsRef.current.visible = false; // Hide nails for left-hand facing the camera and finger not bent
          return;
        }
    
        nailsRef.current.visible = true; // Show nails otherwise
    
        const fingerSize = calculateDistance(middleFingerMCP, nailsFingerMCP);
    
        // Scale and position adjustments for right hand
        const nailsFingerZ = 200;
        const scaleFactor = (fingerSize * outputWidth) / 1.7;
    
        let nailsFingerX: number;
        let nailsFingerY: number;
    
        if (isPalmFacingBack) {
          nailsFingerX = (1 - nailsFingerDIP.x - 0.498) * outputWidth;
          nailsFingerY = -(nailsFingerDIP.y - 0.5) * outputHeight;
        } else {
          nailsFingerX = (1 - nailsFingerDIP.x - 0.495) * outputWidth;
          nailsFingerY = -(nailsFingerDIP.y - 0.519) * outputHeight;
        }
    
        nailsRef.current.position.set(nailsFingerX, nailsFingerY, nailsFingerZ);
    
        const quaternion = handQuaternion(handLandmarks.current, 8, 12);
    
        if (quaternion) {
          nailsRef.current.setRotationFromQuaternion(quaternion);
        }
    
        // Adjust rotation based on hand type
        if (isPalmFacingBack) {
          nailsRef.current.rotation.y += 9.3;
          nailsRef.current.scale.set(scaleFactor * 0.52, scaleFactor * 0.2, scaleFactor * 0.6);
        } else {
          nailsRef.current.rotation.y += 0.01;
          nailsRef.current.scale.set(scaleFactor * 0.8, scaleFactor * 0.2, scaleFactor * 0.82);
        }
    
        // Update nail color dynamically during the frame
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

const NailIndex: React.FC<NailIndexProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <NailIndexInner {...props} />
    </Suspense>
  );
};

export default NailIndex;
