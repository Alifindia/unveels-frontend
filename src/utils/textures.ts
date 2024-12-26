import { useTexture } from "@react-three/drei";
import { LinearSRGBColorSpace, SRGBColorSpace } from "three";
import _ from "lodash";

export const useLoadTextures = () => {
  const [
    bodyTexture,
    eyesTexture,
    teethTexture,
    bodySpecularTexture,
    bodyRoughnessTexture,
    bodyNormalTexture,
    teethNormalTexture,
    // teethSpecularTexture,
    hairTexture,
    tshirtDiffuseTexture,
    tshirtNormalTexture,
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture,
  ] = useTexture([
    "/media/unveels/avatar-images/body.webp",
    "/media/unveels/avatar-images/eyes.webp",
    "/media/unveels/avatar-images/teeth_diffuse.webp",
    "/media/unveels/avatar-images/body_specular.webp",
    "/media/unveels/avatar-images/body_roughness.webp",
    "/media/unveels/avatar-images/body_normal.webp",
    "/media/unveels/avatar-images/teeth_normal.webp",
    // "/teeth_specular.webp",
    "/media/unveels/avatar-images/h_color.webp",
    "/media/unveels/avatar-images/tshirt_diffuse.webp",
    "/media/unveels/avatar-images/tshirt_normal.webp",
    "/media/unveels/avatar-images/tshirt_roughness.webp",
    "/media/unveels/avatar-images/h_alpha.webp",
    "/media/unveels/avatar-images/h_normal.webp",
    "/media/unveels/avatar-images/h_roughness.webp",
  ]);

  _.each(
    [
      bodyTexture,
      eyesTexture,
      teethTexture,
      teethNormalTexture,
      bodySpecularTexture,
      bodyRoughnessTexture,
      bodyNormalTexture,
      tshirtDiffuseTexture,
      tshirtNormalTexture,
      tshirtRoughnessTexture,
      hairAlphaTexture,
      hairNormalTexture,
      hairRoughnessTexture,
    ],
    (texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.flipY = false;
    },
  );

  bodyNormalTexture.colorSpace = LinearSRGBColorSpace;
  tshirtNormalTexture.colorSpace = LinearSRGBColorSpace;
  teethNormalTexture.colorSpace = LinearSRGBColorSpace;
  hairNormalTexture.colorSpace = LinearSRGBColorSpace;

  return {
    bodyTexture,
    eyesTexture,
    teethTexture,
    bodySpecularTexture,
    bodyRoughnessTexture,
    bodyNormalTexture,
    teethNormalTexture,
    hairTexture,
    tshirtDiffuseTexture,
    tshirtNormalTexture,
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture,
  };
};
