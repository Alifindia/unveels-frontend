export const BilateralFilterShader = {
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = vec2(1.0 - uv.x, uv.y);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D imageTexture;
    uniform sampler2D maskTexture;
    uniform vec2 resolution;
    uniform float sigmaSpatial;
    uniform float sigmaColor;
    uniform float smoothingStrength;

    void main(){
      float mask = texture2D(maskTexture, vUv).r;
      if(mask < 0.5){
        gl_FragColor = texture2D(imageTexture, vUv);
        return;
      }

      vec4 originalColor = texture2D(imageTexture, vUv);
      float twoSigmaSpatialSq = 2.0 * sigmaSpatial * sigmaSpatial;
      float twoSigmaColorSq = 2.0 * sigmaColor * sigmaColor;

      vec3 colorSum = vec3(0.0);
      float weightSum = 0.0;

      int kernelRadius = int(ceil(3.0 * sigmaSpatial));
      kernelRadius = min(kernelRadius, 10);

      for(int x = -10; x <= 10; x++) {
        for(int y = -10; y <= 10; y++) {
          float distanceSq = float(x * x + y * y);
          if(distanceSq > (float(kernelRadius) * float(kernelRadius))){
            continue;
          }

          vec2 offset = vec2(float(x), float(y)) / resolution;

          vec4 neighborColor = texture2D(imageTexture, vUv + offset);

          float spatialWeight = exp(-(distanceSq) / twoSigmaSpatialSq);
          float colorDist = distance(neighborColor.rgb, originalColor.rgb);
          float colorWeight = exp(-(colorDist * colorDist) / twoSigmaColorSq);
          float weight = spatialWeight * colorWeight;

          colorSum += neighborColor.rgb * weight;
          weightSum += weight;
        }
      }

      vec3 bilateralColor = colorSum / weightSum;
      vec3 skinBlendColor = mix(originalColor.rgb, bilateralColor, smoothingStrength * 1.2);

      gl_FragColor = vec4(skinBlendColor, originalColor.a);
    }
  `,
};
