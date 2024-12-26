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
        opacity: 0.9,
      });
    }, [selectedTexture]);

    useFrame(() => {
      if (!landmarks.current) return;

      // Ekstrak landmarks untuk mata kiri
      const leftEyeCenter = landmarks.current[468];
      const leftEyeCornerRight = landmarks.current[471];
      const leftEyeCornerLeft = landmarks.current[469];

      // Ekstrak landmarks untuk mata kanan
      const rightEyeCenter = landmarks.current[473];
      const rightEyeCornerRight = landmarks.current[476];
      const rightEyeCornerLeft = landmarks.current[474];

      // Pastikan semua landmark yang diperlukan ada
      if (
        !leftEyeCenter ||
        !leftEyeCornerRight ||
        !leftEyeCornerLeft ||
        !rightEyeCenter ||
        !rightEyeCornerRight ||
        !rightEyeCornerLeft
      )
        return;

      // Hitung transformasi
      const leftEyeTransform = getEyeTransform(
        leftEyeCenter,
        leftEyeCornerLeft,
        leftEyeCornerRight,
        planeSize,
      );
      const rightEyeTransform = getEyeTransform(
        rightEyeCenter,
        rightEyeCornerLeft,
        rightEyeCornerRight,
        planeSize,
      );

      // Update posisi dan skala lensa kiri
      if (leftLensRef.current) {
        leftLensRef.current.position.copy(leftEyeTransform.position);
        leftLensRef.current.scale.set(
          leftEyeTransform.scale,
          leftEyeTransform.scale,
          leftEyeTransform.scale,
        );
      }

      // Update posisi dan skala lensa kanan
      if (rightLensRef.current) {
        rightLensRef.current.position.copy(rightEyeTransform.position);
        rightLensRef.current.scale.set(
          rightEyeTransform.scale,
          rightEyeTransform.scale,
          rightEyeTransform.scale,
        );
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
