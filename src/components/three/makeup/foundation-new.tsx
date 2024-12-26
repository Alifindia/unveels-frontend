import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import {
  FrontSide,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  WebGLRenderer,
} from "three";
import { Landmark } from "../../../types/landmark";
import { FACECAP, GLASESS, HAT } from "../../../utils/constants";
import { useAccesories } from "../../../context/accesories-context";
import { calculateDistance } from "../../../utils/calculateDistance";
import { calculateFaceOrientation } from "../../../utils/calculateFaceOrientation";
import { GLTFLoader, KTX2Loader, MeshoptDecoder } from "three-stdlib";
import { Blendshape } from "../../../types/blendshape";

const blendshapeMapping = {
  browInnerUp: "browInnerUp",
  browDownLeft: "browDown_L",
  browDownRight: "browDown_R",
  browOuterUpLeft: "browOuterUp_L",
  browOuterUpRight: "browOuterUp_R",
  eyeLookUpLeft: "eyeLookUp_L",
  eyeLookUpRight: "eyeLookUp_R",
  eyeLookDownLeft: "eyeLookDown_L",
  eyeLookDownRight: "eyeLookDown_R",
  eyeLookInLeft: "eyeLookIn_L",
  eyeLookInRight: "eyeLookIn_R",
  eyeLookOutLeft: "eyeLookOut_L",
  eyeLookOutRight: "eyeLookOut_R",
  eyeBlinkLeft: "eyeBlink_L",
  eyeBlinkRight: "eyeBlink_R",
  eyeSquintLeft: "eyeSquint_L",
  eyeSquintRight: "eyeSquint_R",
  eyeWideLeft: "eyeWide_L",
  eyeWideRight: "eyeWide_R",
  cheekPuff: "cheekPuff",
  cheekSquintLeft: "cheekSquint_L",
  cheekSquintRight: "cheekSquint_R",
  noseSneerLeft: "noseSneer_L",
  noseSneerRight: "noseSneer_R",
  jawOpen: "jawOpen",
  jawForward: "jawForward",
  jawLeft: "jawLeft",
  jawRight: "jawRight",
  mouthFunnel: "mouthFunnel",
  mouthPucker: "mouthPucker",
  mouthLeft: "mouthLeft",
  mouthRight: "mouthRight",
  mouthRollUpper: "mouthRollUpper",
  mouthRollLower: "mouthRollLower",
  mouthShrugUpper: "mouthShrugUpper",
  mouthShrugLower: "mouthShrugLower",
  mouthClose: "mouthClose",
  mouthSmileLeft: "mouthSmile_L",
  mouthSmileRight: "mouthSmile_R",
  mouthFrownLeft: "mouthFrown_L",
  mouthFrownRight: "mouthFrown_R",
  mouthDimpleLeft: "mouthDimple_L",
  mouthDimpleRight: "mouthDimple_R",
  mouthUpperUpLeft: "mouthUpperUp_L",
  mouthUpperUpRight: "mouthUpperUp_R",
  mouthLowerDownLeft: "mouthLowerDown_L",
  mouthLowerDownRight: "mouthLowerDown_R",
  mouthPressLeft: "mouthPress_L",
  mouthPressRight: "mouthPress_R",
  mouthStretchLeft: "mouthStretch_L",
  mouthStretchRight: "mouthStretch_R",
  tongueOut: "tongueOut",
};

interface FoundationNewProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  blendshape: React.RefObject<Blendshape[]>;
}

const FoundationNewInner: React.FC<FoundationNewProps> = React.memo(
  ({ landmarks, planeSize, blendshape }) => {
    const foundationRef = useRef<Object3D | null>(null);
    const { scene, viewport, gl } = useThree(); // Ambil ukuran viewport dan layar
    const { envMapAccesories } = useAccesories();
    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];
    const ktx2Loader = new KTX2Loader().setTranscoderPath(
      `https://unpkg.com/three@0.168.0/examples/jsm/libs/basis/`,
    );
    const loader = new GLTFLoader();

    const { scaleMultiplier } = useMemo(() => {
      if (viewport.width > 1200) {
        return { scaleMultiplier: 2750 };
      }
      return { scaleMultiplier: 800 };
    }, [viewport.width]);

    useEffect(() => {
      loader.setKTX2Loader(ktx2Loader.detectSupport(gl));
      loader.setMeshoptDecoder(MeshoptDecoder);

      loader.load(
        FACECAP,
        (gltf) => {
          const foundation = gltf.scene;
          foundation.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.side = FrontSide;
                mesh.material.depthTest = false;
                mesh.material.depthWrite = false;
                mesh.material.needsUpdate = true;
              }

              child.renderOrder = 2;
            }
          });

          foundationRef.current = foundation;
          scene.add(foundation);
          console.log("Glasess model loaded successfully");
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the Glasess model: ", error);
        },
      );

      return () => {
        if (foundationRef.current) {
          scene.remove(foundationRef.current);
        }
      };
    }, [scene]);

    useFrame(() => {
      if (!landmarks.current || !foundationRef.current || !blendshape.current)
        return;

      const centerEye = landmarks.current[4];

      // Scale coordinates proportionally with the viewport
      const scaleX = viewport.width / outputWidth;
      const scaleY = viewport.height / outputHeight;

      const centerEyeX =
        (1 - centerEye.x) * outputWidth * scaleX - viewport.width / 2;
      const centerEyeY =
        -centerEye.y * outputHeight * scaleY + viewport.height / 2;
      const centerEyeZ = -centerEye.z * 100;

      const faceSize = calculateDistance(
        landmarks.current[366],
        landmarks.current[93],
      );

      // Set position and scale
      foundationRef.current.position.set(centerEyeX, centerEyeY, centerEyeZ);

      const scaleFactor = faceSize * Math.min(scaleX, scaleY) * scaleMultiplier;

      foundationRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

      const quaternion = calculateFaceOrientation(landmarks.current);
      // Set the rotation of the glasess object from the final quaternion
      if (quaternion) {
        foundationRef.current.setRotationFromQuaternion(quaternion);
      }

      // Traverse children to find mesh with morph targets
      foundationRef.current.traverse((child) => {
        if (child instanceof Mesh && child.morphTargetInfluences) {
          const influences = child.morphTargetInfluences;

          // Loop through blendshapeMapping to update morph target values
          Object.entries(blendshapeMapping).forEach(
            ([blendshapeName, targetName]) => {
              if (blendshape.current) {
                const blendshapeData = blendshape.current.find(
                  (b) => b.categoryName === blendshapeName,
                );
                const index = child.morphTargetDictionary?.[targetName];

                if (index !== undefined && blendshapeData) {
                  influences[index] = blendshapeData.score || 0;
                }
              }
            },
          );
        }
      });
    });

    return null;
  },
);

const FoundationNew: React.FC<FoundationNewProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <FoundationNewInner {...props} />
    </Suspense>
  );
};

export default FoundationNew;
