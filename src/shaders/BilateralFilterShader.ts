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

export const CustomBilateralShader = {
  vertexShader: `  varying vec2 vUv;
  void main(){
    vUv = vec2(1.0 - uv.x, uv.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }`
  ,
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
    vec2 texelSize = 1.0 / resolution;

    // Sample the mask
    float rawMask = texture2D(maskTexture, vUv).r;

    // FINAL MASK ADJUSTMENT: Lowered lowest, increased mid and high
    float boostedMask;

    // Lowest gray values (0.0-0.15): Slightly lowered effect
    if (rawMask < 0.15) {
        boostedMask = rawMask * 0.5; // Reduced from 0.6 to 0.5
    }
    // Low gray values (0.15-0.3): Unchanged
    else if (rawMask < 0.3) {
        boostedMask = mix(0.25, 0.55, (rawMask - 0.15) / 0.15); // Keeping the same
    }
    // Mid gray values (0.3-0.6): FURTHER INCREASED effect
    else if (rawMask < 0.6) {
        boostedMask = mix(0.7, 0.97, (rawMask - 0.3) / 0.3); // Boosted from 0.65-0.95 to 0.7-0.97
    }
    // High gray values (0.6-0.85): MAXIMUM effect
    else if (rawMask < 0.85) {
        boostedMask = 0.99; // Increased from 0.98 to 0.99
    }
    // Highest gray/white values (0.85-1.0): Full effect
    else {
        boostedMask = 1.0; // Maximum effect for white areas
    }

    // Detect edges with gradient calculation
    float dx = dFdx(boostedMask);
    float dy = dFdy(boostedMask);
    float edgeFactor = sqrt(dx * dx + dy * dy);

    // Apply smoothing to the mask edges for better transitions
    float edgeWidth = 0.5;
    float mask = smoothstep(0.2 - edgeWidth, 0.2 + edgeWidth, boostedMask);

    // Combine with edge detection
    mask = mix(boostedMask, mask, min(edgeFactor * 5.0, 1.0));

    // If outside mask area, show original color
    if(mask < 0.05){
      gl_FragColor = texture2D(imageTexture, vUv);
      return;
    }

    vec4 originalColor = texture2D(imageTexture, vUv);

    // FINAL BLUR INTENSITY: Adjusted based on feedback
    float intensityMultiplier;

    // Adjust intensity multiplier based on mask value for more nuanced control
    if (mask < 0.2) {
        // Lowest values: Slightly lowered intensity
        intensityMultiplier = 1.1; // Reduced from 1.3 to 1.1
    } else if (mask < 0.4) {
        // Low values: Unchanged
        intensityMultiplier = 2.0; // Keeping the same
    } else if (mask < 0.7) {
        // Mid values: FURTHER INCREASED intensity
        intensityMultiplier = 3.5; // Increased from 3.2 to 3.5
    } else {
        // High values: MAXIMUM intensity
        intensityMultiplier = 4.0; // Increased from 3.6 to 4.0
    }

    float dynamicSigmaSpatial = sigmaSpatial * mask * intensityMultiplier;
    float dynamicSigmaColor = sigmaColor * mask * intensityMultiplier;
    float twoSigmaSpatialSq = 2.0 * dynamicSigmaSpatial * dynamicSigmaSpatial;
    float twoSigmaColorSq = 2.0 * dynamicSigmaColor * dynamicSigmaColor;

    vec3 colorSum = vec3(0.0);
    float weightSum = 0.0;

    // FINAL KERNEL RADIUS: Adjusted based on feedback
    float kernelMultiplier;
    if (mask < 0.2) {
        kernelMultiplier = 4.0; // Reduced for lowest values
    } else if (mask < 0.4) {
        kernelMultiplier = 5.0; // Unchanged for low values
    } else if (mask < 0.7) {
        kernelMultiplier = 6.5; // Increased for mid values
    } else {
        kernelMultiplier = 7.0; // Increased for high values
    }

    int kernelRadius = int(ceil(kernelMultiplier * dynamicSigmaSpatial));
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

    // Calculate dominant color from the masked region for better blending
    vec3 bilateralColor = weightSum > 0.0 ? colorSum / weightSum : originalColor.rgb;

    // ENHANCEMENT: Further increased warm tone enhancement for more visible effect
    vec3 warmEnhanced = bilateralColor;
    warmEnhanced.r = min(bilateralColor.r * (1.0 + 0.15 * mask), 1.0); // Increased from 0.12 to 0.15
    warmEnhanced.g = min(bilateralColor.g * (1.0 + 0.08 * mask), 1.0); // Increased from 0.06 to 0.08

    // ENHANCEMENT: Dramatically increased blend factor for maximum visibility
    float blendFactor = min(smoothingStrength * mask * 2.5, 1.0); // Increased from 2.0 to 2.5
    vec3 skinBlendColor = mix(originalColor.rgb, warmEnhanced, blendFactor);

    gl_FragColor = vec4(skinBlendColor, originalColor.a);
  }
`,
};