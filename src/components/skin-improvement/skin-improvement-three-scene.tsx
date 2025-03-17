import React, { useEffect, useRef, useMemo, useState } from "react";
import { MeshProps, useThree, useLoader, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Landmark } from "../../types/landmark";
import {
  Vector2,
  ShaderMaterial,
  LinearFilter,
  DoubleSide,
  TextureLoader,
  CanvasTexture,
  BufferGeometry,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Mesh,
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  MeshBasicMaterial,
} from "three";
import { useSkinImprovement } from "../../context/see-improvement-context";
import {
  BilateralFilterShader,
  CustomBilateralShader,
} from "../../shaders/BilateralFilterShader";
import {
  faces,
  uvs,
  positions,
  CONCEALER_TEXTURE,
  CONTOUR_TEXTURE_ONE,
  LIPLINER_TEXTURE_TWO,
  BLUSH_TEXTURE_ONE_ONE,
  DARK_CIRCLE_ALPHA,
  MOISTURES_ALPHA,
  REDNESS_ALPHA,
  LASHES_ONE,
  DROPY_ALPHA,
  WRINKLE_ALPHA,
  LIPS_TEXTURE_ONE,
  LIPLINER_TEXTURE_ONE,
} from "../../utils/constants";

// Define facial feature types
export type FacialFeatureType =
  | "acne"
  | "blackhead"
  | "dark circle"
  | "droopy eyelid lower"
  | "droopy eyelid upper"
  | "dry"
  | "eyebag"
  | "firmness"
  | "moistures"
  | "oily"
  | "pore"
  | "radiance"
  | "skinredness"
  | "spots"
  | "texture"
  | "whitehead"
  | "wrinkles";

interface SkinImprovementThreeSceneProps extends MeshProps {
  imageSrc: string;
  landmarks: Landmark[];
}

// Apply stretched landmarks for forehead
const applyStretchedLandmarks = (faceLandmarks: Landmark[]) => {
  return faceLandmarks.map((landmark, index) => {
    const isForehead = [54, 103, 67, 109, 10, 338, 297, 332, 284].includes(
      index,
    );

    if (isForehead) {
      const foreheadShiftY = 0.06;
      const foreheadShiftZ = 0.1;

      return {
        x: landmark.x,
        y: landmark.y - foreheadShiftY,
        z: landmark.z + foreheadShiftZ,
      };
    }
    return landmark;
  });
};

const SkinImprovementThreeScene: React.FC<SkinImprovementThreeSceneProps> = ({
  imageSrc,
  landmarks,
  ...props
}) => {
  const texture = useTexture(imageSrc);
  const { viewport } = useThree();
  const [planeSize, setPlaneSize] = useState<[number, number]>([1, 1]);
  const filterRef = useRef<ShaderMaterial>(null);
  const [maskTexture, setMaskTexture] = useState<CanvasTexture | null>(null);

  // Get parameters from skin improvement context
  const {
    sigmaSpatial,
    sigmaColor,
    smoothingStrength,
    featureType,
    setSmoothingStrength,
  } = useSkinImprovement();

  // Load alphamap texture for the specific feature
  const alphaMapPath = useMemo(() => {
    // Change paths to your actual PNG alphamaps for each feature

    return "/media/unveels/vto-assets/texture/skin-problem.png";
  }, [featureType]);

  // We'll load the PNG texture directly
  const alphaMap = useLoader(TextureLoader, alphaMapPath);

  // Calculate plane size based on image aspect ratio and viewport
  useEffect(() => {
    if (!texture.image) return;

    const imageAspect = texture.image.width / texture.image.height;
    const viewportAspect = viewport.width / viewport.height;

    let planeWidth: number;
    let planeHeight: number;

    if (imageAspect > viewportAspect) {
      // Image is wider than viewport
      planeHeight = viewport.height;
      planeWidth = viewport.height * imageAspect;
    } else {
      // Image is taller than viewport
      planeWidth = viewport.width;
      planeHeight = viewport.width / imageAspect;
    }

    // For object-cover, we want the plane to be at least as large as viewport in both dimensions
    planeWidth = Math.max(planeWidth, viewport.width);
    planeHeight = Math.max(planeHeight, viewport.height);

    setPlaneSize([planeWidth, planeHeight]);
  }, [texture, viewport]);

  // Fungsi untuk mengupdate smoothingStrength berdasarkan pesan yang diterima
  const updateSmoothingStrength = (newSmoothingStrength: number) => {
    console.log("Smoothing Strength updated to:", newSmoothingStrength);
    setSmoothingStrength(newSmoothingStrength);
  };

  useEffect(() => {
    // Handler untuk menerima pesan dari Flutter atau browser
    const handleMessage = (event: MessageEvent) => {
      console.log("Message received:", event); // Tambahkan log untuk event itu sendiri

      // Periksa data yang diterima
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          console.log("Parsed data:", data); // Log data setelah parsing

          // Memperbarui smoothingStrength jika data yang diterima valid
          if (data.smoothingStrength !== undefined) {
            updateSmoothingStrength(data.smoothingStrength);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      } else {
        console.warn("No data received in message event");
      }
    };

    // Menambahkan event listener untuk mendengarkan pesan
    window.addEventListener("message", handleMessage);

    // Membersihkan event listener saat komponen unmount
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Create a temporary face mesh and render it to a canvas with the alphamap
  useEffect(() => {
    if (
      !texture.image ||
      !alphaMap ||
      !alphaMap.image ||
      landmarks.length === 0
    )
      return;

    // Create offscreen renderer
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(texture.image.width, texture.image.height);

    // Create a scene
    const scene = new Scene();

    // Create a camera
    const camera = new OrthographicCamera(
      -texture.image.width / 2,
      texture.image.width / 2,
      texture.image.height / 2,
      -texture.image.height / 2,
      0.1,
      1000,
    );
    camera.position.z = 10;

    // Create a geometry for the face mesh
    const geometry = new BufferGeometry();

    // Apply landmark positions - exactly like in FaceMesh
    const outputWidth = texture.image.width;
    const outputHeight = texture.image.height;

    // Apply stretched landmarks
    const modifiedLandmarks = applyStretchedLandmarks(landmarks);

    // Create vertices array
    const vertices = new Float32Array(positions.length * 3);
    for (
      let i = 0;
      i < Math.min(modifiedLandmarks.length, positions.length);
      i++
    ) {
      const landmark = modifiedLandmarks[i];
      const x = (landmark.x - 0.5) * outputWidth;
      const y = -(landmark.y - 0.5) * outputHeight;
      const z = 0;

      vertices[i * 3] = x;
      vertices[i * 3 + 1] = y;
      vertices[i * 3 + 2] = z;
    }

    // Set up UV coordinates - exactly like in your face mesh
    const uvArray = new Float32Array(uvs.length * 2);
    for (let i = 0; i < uvs.length; i++) {
      uvArray[i * 2] = uvs[i][0];
      uvArray[i * 2 + 1] = uvs[i][1];
    }

    // Set attributes and indices
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uvArray, 2));
    geometry.setIndex(new Uint16BufferAttribute(faces, 1));
    geometry.computeVertexNormals();

    // Create a material with the alphamap
    const material = new MeshBasicMaterial({
      alphaMap: alphaMap,
      transparent: true,
      opacity: 1.0,
    });

    // Create the mesh and add to scene
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    // Render the scene
    renderer.render(scene, camera);

    // Create a texture from the renderer's canvas
    const newMaskTexture = new CanvasTexture(renderer.domElement);
    newMaskTexture.minFilter = LinearFilter;
    newMaskTexture.magFilter = LinearFilter;
    newMaskTexture.needsUpdate = true;

    // Set as mask texture
    setMaskTexture(newMaskTexture);

    // Clean up resources
    return () => {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [landmarks, texture.image, alphaMap, featureType]);

  // Update shader uniforms when parameters change
  useEffect(() => {
    if (filterRef.current && maskTexture) {
      filterRef.current.uniforms.imageTexture.value = texture;
      filterRef.current.uniforms.maskTexture.value = maskTexture;
      filterRef.current.uniforms.resolution.value.set(
        texture.image.width,
        texture.image.height,
      );
      filterRef.current.uniforms.sigmaSpatial.value = sigmaSpatial;
      filterRef.current.uniforms.sigmaColor.value = sigmaColor;
      filterRef.current.uniforms.smoothingStrength.value = smoothingStrength;
      filterRef.current.needsUpdate = true;
    }
  }, [texture, maskTexture, sigmaSpatial, sigmaColor, smoothingStrength]);

  return (
    <>
      {maskTexture && (
        <mesh position={[0, 0, -10]} {...props}>
          <planeGeometry args={[planeSize[0], planeSize[1]]} />
          <shaderMaterial
            ref={filterRef}
            args={[
              {
                vertexShader: CustomBilateralShader.vertexShader,
                fragmentShader: CustomBilateralShader.fragmentShader,
                side: DoubleSide,
                uniforms: {
                  imageTexture: { value: texture },
                  maskTexture: { value: maskTexture },
                  resolution: {
                    value: new Vector2(
                      texture.image.width,
                      texture.image.height,
                    ),
                  },
                  sigmaSpatial: { value: sigmaSpatial },
                  sigmaColor: { value: sigmaColor },
                  smoothingStrength: { value: smoothingStrength },
                },
              },
            ]}
          />
        </mesh>
      )}
    </>
  );
};

export default SkinImprovementThreeScene;
