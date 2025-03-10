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
    vec2 texelSize = 1.0 / resolution;
    vec4 originalColor = texture2D(imageTexture, vUv);

    // Sample the mask and create a softer edge with improved edge detection
    float rawMask = texture2D(maskTexture, vUv).r;

    // Early exit for completely unmasked areas (better performance)
    if(rawMask < 0.01) {
      gl_FragColor = originalColor;
      return;
    }

    // Enhanced edge detection
    float dx = dFdx(rawMask);
    float dy = dFdy(rawMask);
    float edgeFactor = sqrt(dx * dx + dy * dy);

    // Adaptive edge width based on mask gradient
    float edgeWidth = 0.35 - 0.2 * min(1.0, edgeFactor * 10.0);
    float mask = smoothstep(0.5 - edgeWidth, 0.5 + edgeWidth, rawMask);

    // Improved transition with gradient-aware blending
    mask = mix(rawMask, mask, min(edgeFactor * 5.0, 1.0));

    // Proportional blur intensity based on mask value
    float dynamicSigmaSpatial = sigmaSpatial * mask;
    float dynamicSigmaColor = sigmaColor * mask;
    float twoSigmaSpatialSq = 2.0 * dynamicSigmaSpatial * dynamicSigmaSpatial;
    float twoSigmaColorSq = 2.0 * dynamicSigmaColor * dynamicSigmaColor;

    // Adaptive kernel radius with better performance bounds
    int kernelRadius = int(ceil(2.5 * dynamicSigmaSpatial));
    kernelRadius = max(1, min(kernelRadius, 10)); // Ensure minimum effect and cap max radius

    vec3 colorSum = vec3(0.0);
    float weightSum = 0.0;

    // Optimized sampling loop with early termination
    // Pre-compute center values for the weight calculations
    vec3 centerColor = originalColor.rgb;

    for(int x = -10; x <= 10; x++) {
      for(int y = -10; y <= 10; y++) {
        float distanceSq = float(x * x + y * y);

        // Skip samples outside kernel radius (optimization)
        if(distanceSq > float(kernelRadius * kernelRadius)) {
          continue;
        }

        vec2 offset = vec2(float(x), float(y)) * texelSize;
        vec4 neighborColor = texture2D(imageTexture, vUv + offset);

        // Calculate spatial weight based on pixel distance
        float spatialWeight = exp(-distanceSq / twoSigmaSpatialSq);

        // Calculate color weight based on color difference
        float colorDist = distance(neighborColor.rgb, centerColor);
        float colorWeight = exp(-(colorDist * colorDist) / twoSigmaColorSq);

        // Combined weight
        float weight = spatialWeight * colorWeight;

        colorSum += neighborColor.rgb * weight;
        weightSum += weight;
      }
    }

    // Normalize the result
    vec3 bilateralColor = colorSum / max(weightSum, 0.0001);

    // Enhanced color adjustments proportional to mask intensity
    vec3 enhancedColor = bilateralColor;

    // Warm tone enhancement
    enhancedColor.r = min(bilateralColor.r * (1.0 + 0.06 * mask), 1.0);
    enhancedColor.g = min(bilateralColor.g * (1.0 + 0.03 * mask), 1.0);

    // Optional: subtle contrast enhancement
    vec3 contrastEnhanced = (enhancedColor - 0.5) * (1.0 + 0.1 * mask) + 0.5;
    enhancedColor = clamp(contrastEnhanced, 0.0, 1.0);

    // Progressive blending based on mask intensity
    float finalBlendFactor = smoothingStrength * pow(mask, 1.2); // Slightly non-linear response
    vec3 finalColor = mix(originalColor.rgb, enhancedColor, finalBlendFactor);

    gl_FragColor = vec4(finalColor, originalColor.a);
  }
`
};