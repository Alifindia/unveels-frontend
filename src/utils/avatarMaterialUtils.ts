import {
  LineBasicMaterial,
  Mesh,
  MeshPhysicalMaterial,
  SkinnedMesh,
  LineSegments,
} from "three";
import * as THREE from "three";

interface Textures {
  bodyTexture: THREE.Texture;
  bodyRoughnessTexture: THREE.Texture;
  bodyNormalTexture: THREE.Texture;
  eyesTexture: THREE.Texture;
  teethTexture: THREE.Texture;
  teethNormalTexture: THREE.Texture;
  hairTexture: THREE.Texture;
  tshirtDiffuseTexture: THREE.Texture;
  tshirtRoughnessTexture: THREE.Texture;
  tshirtNormalTexture: THREE.Texture;
}

const textureLoader = new THREE.TextureLoader();

export function applyAvatarMaterials(
  node: Mesh | LineSegments | SkinnedMesh,
  textures: Textures,
) {
  node.castShadow = true;
  node.receiveShadow = false;
  node.frustumCulled = false;

  if (node.name.includes("Body")) {
    node.material = new MeshPhysicalMaterial({
      map: textures.bodyTexture,
      roughness: 1.4,
      roughnessMap: textures.bodyRoughnessTexture,
      normalMap: textures.bodyNormalTexture,
      normalMapType: THREE.TangentSpaceNormalMap,
      bumpScale: 0.1,
      normalScale: new THREE.Vector2(2, 2), // Increase the normal map intensity
      metalness: 0.2,
      envMapIntensity: 0.5,
    });
  } else if (node.name.includes("Eyes")) {
    node.material = new THREE.MeshStandardMaterial({
      map: textures.eyesTexture,
      roughness: 0.1,
      envMapIntensity: 0.5,
    });
  } else if (node.name.includes("Brows")) {
    node.material = new LineBasicMaterial({
      color: 0x000000,
      linewidth: 1,
      opacity: 0.5,
      transparent: true,
    });
    node.visible = false;
  } else if (node.name.includes("Teeth")) {
    node.material = new THREE.MeshStandardMaterial({
      map: textures.teethTexture,
      roughness: 0.7,
      normalMap: textures.teethNormalTexture,
      envMapIntensity: 0.7,
    });
  } else if (node.name.includes("Hair")) {
    node.material = new THREE.MeshStandardMaterial({
      map: textures.hairTexture,
      transparent: false,
      depthWrite: false,
      roughness: 1,
      metalness: 1,
    });
  } else if (node.name.includes("TSHIRT")) {
    node.material = new THREE.MeshStandardMaterial({
      map: textures.tshirtDiffuseTexture,
      roughnessMap: textures.tshirtRoughnessTexture,
      normalMap: textures.tshirtNormalTexture,
      roughness: 1,
      metalness: 5,
      color: new THREE.Color(0xffffff),
      envMapIntensity: 0.5,
    });
  }
}
