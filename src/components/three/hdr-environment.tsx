// src/components/HDREnvironment.tsx
import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { RGBELoader } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

interface HDREnvironmentProps {
  hdrPath: string;
  onLoaded?: (envMap: THREE.Texture) => void;
}

const HDREnvironment: React.FC<HDREnvironmentProps> = ({
  hdrPath,
  onLoaded,
}) => {
  const { scene, gl } = useThree();

  useEffect(() => {
    const loader = new RGBELoader();
    loader.load(
      hdrPath,
      (texture) => {
        const pmremGenerator = new THREE.PMREMGenerator(gl);
        pmremGenerator.compileEquirectangularShader();
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        if (onLoaded) onLoaded(envMap);
        texture.dispose();
        pmremGenerator.dispose();
      },
      undefined,
      (err) => {
        console.error(`Error loading HDR environment from ${hdrPath}:`, err);
      },
    );
  }, [hdrPath, gl, onLoaded]);

  return null;
};

export default HDREnvironment;
