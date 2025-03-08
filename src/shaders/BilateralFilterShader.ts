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
  vertexShader: BilateralFilterShader.vertexShader,
  fragmentShader: `
        uniform sampler2D imageTexture;
        uniform sampler2D maskTexture;
        uniform vec2 resolution;
        uniform float sigmaSpatial;
        uniform float sigmaColor;
        uniform float smoothingStrength;

        varying vec2 vUv;

        void main() {
          vec4 originalColor = texture2D(imageTexture, vUv);
          float maskValue = texture2D(maskTexture, vUv).r;

          // Skip processing if mask is completely black (outside face area)
          if (maskValue <= 0.01) {
            gl_FragColor = originalColor;
            return;
          }

          // Adaptive filter radius based on the mask value and smoothing strength
          // Increased base radius for smoother overall effect
          float spatialRadius = (sigmaSpatial * 1.5) * smoothingStrength * maskValue;

          // Bilateral filter implementation - focusing on smoothing skin imperfections
          vec4 filteredColor = vec4(0.0);
          float totalWeight = 0.0;

          // For calculating dominant color
          const int numBins = 8; // Color quantization bins per channel
          float colorBins[numBins * numBins * numBins];
          vec4 dominantColor = vec4(0.0);

          for (int i = 0; i < numBins * numBins * numBins; i++) {
            colorBins[i] = 0.0;
          }

          float maxBinWeight = 0.0;

          // Adjust kernel size based on mask value for performance
          // Increased minimum kernel size for better smoothing
          int kernelSize = int(ceil(spatialRadius * 2.5));
          kernelSize = clamp(kernelSize, 3, 25); // Larger kernel for better smoothing

          // First pass: analyze local area for dominant color and dark spot detection
          for (int y = -kernelSize; y <= kernelSize; y++) {
            for (int x = -kernelSize; x <= kernelSize; x++) {
              vec2 offset = vec2(float(x), float(y)) / resolution;
              vec2 samplePos = vUv + offset;

              // Sample color and mask value
              vec4 sampleColor = texture2D(imageTexture, samplePos);
              float sampleMaskValue = texture2D(maskTexture, samplePos).r;

              // Calculate spatial weight - with wider gaussian for smoother transition
              float spatialDist = length(vec2(float(x), float(y)));
              float spatialWeight = exp(-spatialDist * spatialDist / (2.5 * spatialRadius * spatialRadius));

              // Use edge-aware weighting that considers both in and out of mask regions
              float weightFactor = mix(0.05, 1.0, sampleMaskValue);

              // Calculate color distance
              vec3 colorDiff = sampleColor.rgb - originalColor.rgb;
              float colorDist = length(colorDiff);

              // Special handling for dark spots (potential wrinkles/blemishes)
              float luminance = dot(sampleColor.rgb, vec3(0.299, 0.587, 0.114));
              float origLuminance = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114));

              // If this is a dark spot compared to surroundings, reduce its weight
              float darkSpotFactor = 1.0;
              if (luminance < origLuminance * 0.9) {
                darkSpotFactor = 0.2; // More aggressively reduce influence of dark spots
              }

              // Calculate adjusted color weight
              float colorWeight = exp(-colorDist * colorDist / (2.0 * sigmaColor * sigmaColor)) * darkSpotFactor;

              // Combine weights for bilateral filter - include small weight for outside pixels
              float weight = spatialWeight * colorWeight * weightFactor;
              filteredColor += sampleColor * weight;
              totalWeight += weight;

              // Process dominant color calc only for mask pixels
              if (sampleMaskValue > 0.2 && luminance > origLuminance * 0.85) {
                // Quantize color to bins
                int rBin = int(floor(sampleColor.r * float(numBins - 1)));
                int gBin = int(floor(sampleColor.g * float(numBins - 1)));
                int bBin = int(floor(sampleColor.b * float(numBins - 1)));
                int binIndex = rBin + gBin * numBins + bBin * numBins * numBins;

                // Add weighted count to the bin
                float binWeight = spatialWeight * sampleMaskValue;
                colorBins[binIndex] += binWeight;

                // Track the bin with maximum weight
                if (colorBins[binIndex] > maxBinWeight) {
                  maxBinWeight = colorBins[binIndex];
                  dominantColor = sampleColor;
                }
              }
            }
          }

          // Handle case where no valid samples were found
          if (totalWeight <= 0.0) {
            gl_FragColor = originalColor;
            return;
          }

          // Normalize filtered color
          filteredColor /= totalWeight;

          // Create a very gradual transition curve for smoother blending
          float smoothMask = pow(maskValue, 1.4);

          // Calculate how much to smooth based on local contrast
          float luma = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114));

          // Softer blending with dominant color
          vec4 enhancedColor = mix(filteredColor, dominantColor, smoothMask * 0.12);

          // Check if this pixel is darker than dominant color (potential wrinkle/spot)
          float isDarkerSpot = step(luma, dot(dominantColor.rgb, vec3(0.299, 0.587, 0.114)) * 0.92);

          // Apply stronger correction to darker spots
          if (isDarkerSpot > 0.5 && maskValue > 0.25) {
            // More aggressive smoothing for dark spots
            enhancedColor = mix(enhancedColor, dominantColor, smoothMask * 0.25);
          }

          // Ultra-wide feathering for completely natural blending
          // This creates a much larger transition area
          float featheredMask = smoothstep(0.0, 0.85, maskValue) * pow(maskValue, 1.2) * smoothingStrength * 0.9;

          // Special handling for edges - more gradual transition
          // Use multiple stages for more refined edge blending
          if (maskValue < 0.5) {
            float blendFactor;
            if (maskValue < 0.1) {
                // Extreme edge - almost entirely original
                blendFactor = 0.95;
            } else if (maskValue < 0.25) {
                // Mid edge - stronger blend to original
                blendFactor = mix(0.95, 0.6, (maskValue - 0.1) / 0.15);
            } else {
                // Inner edge - more subtle blend
                blendFactor = mix(0.6, 0.2, (maskValue - 0.25) / 0.25);
            }
            // Blend enhancedColor back toward original in edges
            enhancedColor = mix(enhancedColor, originalColor, blendFactor);
          }

          // Final blend with original - more subtle overall effect
          gl_FragColor = mix(originalColor, enhancedColor, featheredMask);
        }
      `
};