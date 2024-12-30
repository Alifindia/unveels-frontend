import { MeshProps, useFrame, useLoader } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense } from "react";
import { Mesh, MeshBasicMaterial, TextureLoader, Vector3 } from "three";
import { Landmark } from "../../../types/landmark";
import {
  LENS_TEXTURE_ONE,
  LENS_TEXTURE_TWO,
  LENS_TEXTURE_THREE,
  LENS_TEXTURE_FOUR,
} from "../../../utils/constants";
import { useMakeup } from "../../../context/makeup-context";

interface ContactLensProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

// Fungsi untuk menghitung skala dan rotasi lensa kontak
const getEyeTransform = (
  center: Landmark,
  cornerLeft: Landmark,
  cornerRight: Landmark,
  planeSize: [number, number],
) => {
  const outputWidth = planeSize[0];
  const outputHeight = planeSize[1];

  const position = new Vector3(
    -(center.x - 0.5) * outputWidth,
    -(center.y - 0.5) * outputHeight,
    -center.z + 10,
  );

  const horizontalVector = new Vector3(
    cornerRight.x - cornerLeft.x,
    cornerRight.y - cornerLeft.y,
    cornerRight.z - cornerLeft.z,
  );

  const scale = horizontalVector.length() * 1; // Sesuaikan faktor ini untuk ukuran lensa yang tepat

  return { position, scale };
};

// Fungsi menghitung jarak Euclidean
const calculateDistance = (point1: Landmark, point2: Landmark): number => {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) +
      Math.pow(point1.y - point2.y, 2) +
      Math.pow(point1.z - point2.z, 2),
  );
};

// Fungsi menghitung Eye Aspect Ratio (EAR)
const calculateEAR = (
  upper: Landmark,
  lower: Landmark,
  left: Landmark,
  right: Landmark,
): number => {
  const vertical = calculateDistance(upper, lower);
  const horizontal = calculateDistance(left, right);
  return vertical / horizontal;
};

const EAR_THRESHOLD = 0.2; // Threshold EAR untuk mendeteksi mata menutup

const ContactLenses: React.FC<ContactLensProps> = React.memo(
  ({ landmarks, planeSize }) => {
    const { lensPattern } = useMakeup();
    const leftLensRef = useRef<Mesh>(null);
    const rightLensRef = useRef<Mesh>(null);

    // Memuat semua tekstur lensa sekaligus menggunakan useLoader
    const lensTextures = useLoader(TextureLoader, [
      LENS_TEXTURE_ONE,
      LENS_TEXTURE_TWO,
      LENS_TEXTURE_THREE,
      LENS_TEXTURE_FOUR,
    ]);

    // Memilih tekstur berdasarkan lensPattern
    const selectedTexture = lensTextures[lensPattern] || lensTextures[0];

    // Membuat material lensa kontak dengan useMemo
    const contactLensMaterial = useMemo(() => {
      return new MeshBasicMaterial({
        map: selectedTexture,
        transparent: true,
        opacity: 0.5,
      });
    }, [selectedTexture]);

    useFrame(() => {
      if (!landmarks.current) return;

      if (landmarks.current.length > 0) {
        // Ekstrak landmarks untuk mata kiri
        const leftEye = {
          upper: landmarks.current[159],
          lower: landmarks.current[145],
          left: landmarks.current[33],
          right: landmarks.current[133],
        };

        // Ekstrak landmarks untuk mata kanan
        const rightEye = {
          upper: landmarks.current[386],
          lower: landmarks.current[374],
          left: landmarks.current[362],
          right: landmarks.current[263],
        };

        // Hitung EAR untuk mata kiri dan kanan
        const leftEAR = calculateEAR(
          leftEye.upper,
          leftEye.lower,
          leftEye.left,
          leftEye.right,
        );
        const rightEAR = calculateEAR(
          rightEye.upper,
          rightEye.lower,
          rightEye.left,
          rightEye.right,
        );

        // Update visibilitas lensa kiri berdasarkan EAR
        if (leftLensRef.current) {
          leftLensRef.current.visible = leftEAR > EAR_THRESHOLD;
        }

        // Update visibilitas lensa kanan berdasarkan EAR
        if (rightLensRef.current) {
          rightLensRef.current.visible = rightEAR > EAR_THRESHOLD;
        }

        // Transformasi dan posisi lensa tetap dilakukan jika EAR di atas threshold
        if (leftEAR > EAR_THRESHOLD && leftLensRef.current) {
          const leftEyeTransform = getEyeTransform(
            landmarks.current[468],
            landmarks.current[469],
            landmarks.current[471],
            planeSize,
          );
          leftLensRef.current.position.copy(leftEyeTransform.position);
          leftLensRef.current.scale.set(
            leftEyeTransform.scale,
            leftEyeTransform.scale,
            leftEyeTransform.scale,
          );
        }

        if (rightEAR > EAR_THRESHOLD && rightLensRef.current) {
          const rightEyeTransform = getEyeTransform(
            landmarks.current[473],
            landmarks.current[474],
            landmarks.current[476],
            planeSize,
          );
          rightLensRef.current.position.copy(rightEyeTransform.position);
          rightLensRef.current.scale.set(
            rightEyeTransform.scale,
            rightEyeTransform.scale,
            rightEyeTransform.scale,
          );
        }
      }
    });

    return (
      <>
        {/* Mesh untuk lensa kontak mata kiri */}
        <mesh ref={leftLensRef} material={contactLensMaterial}>
          <planeGeometry args={planeSize} />
        </mesh>

        {/* Mesh untuk lensa kontak mata kanan */}
        <mesh ref={rightLensRef} material={contactLensMaterial}>
          <planeGeometry args={planeSize} />
        </mesh>
      </>
    );
  },
);

const ContactLens: React.FC<ContactLensProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <ContactLenses {...props} />
    </Suspense>
  );
};

export default ContactLens;
