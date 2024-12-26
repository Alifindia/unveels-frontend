export const FaceShader = {
  vertexShader: `
          varying vec2 vUv;
          void main() {
              vUv = vec2(1.0 - uv.x, uv.y); // Flip horizontally
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
      `,
  fragmentShader: `
          varying vec2 vUv;
          uniform sampler2D videoTexture;
          uniform vec2 leftEyebrow[4];
          uniform vec2 rightEyebrow[4];
          uniform float archFactor;
          uniform float pinchFactor;
          uniform float horizontalShiftFactor;
          uniform float verticalShiftFactor;
  
          void main() {
              vec2 uv = vUv;
  
              // Clamp UV coordinates to avoid wrapping or bleeding
              uv = clamp(uv, vec2(0.0), vec2(1.0));
  
              // Smooth effect distance
              float maxDist = 0.06;
              float archDist = 0.05;
              float pinchDist = 0.04;
  
              // Apply horizontal shift effect to left eyebrow
              for (int i = 0; i < 4; i++) {
                  float dist = distance(uv, leftEyebrow[i]);
                  if (dist < maxDist) {
                      float effect = smoothstep(maxDist, 0.0, dist);
                      uv.x += horizontalShiftFactor * effect * (maxDist - dist);
                  }
              }
  
              // Apply horizontal shift effect to right eyebrow
              for (int i = 0; i < 4; i++) {
                  float dist = distance(uv, rightEyebrow[i]);
                  if (dist < maxDist) {
                      float effect = smoothstep(maxDist, 0.0, dist);
                      uv.x -= horizontalShiftFactor * effect * (maxDist - dist);
                  }
              }
  
              // Apply vertical shift effect to left eyebrow
              for (int i = 0; i < 4; i++) {
                  float dist = distance(uv, leftEyebrow[i]);
                  if (dist < maxDist) {
                      float effect = smoothstep(maxDist, 0.0, dist);
                      uv.y += verticalShiftFactor * effect * (maxDist - dist);
                  }
              }
  
              // Apply vertical shift effect to right eyebrow
              for (int i = 0; i < 4; i++) {
                  float dist = distance(uv, rightEyebrow[i]);
                  if (dist < maxDist) {
                      float effect = smoothstep(maxDist, 0.0, dist);
                      uv.y += verticalShiftFactor * effect * (maxDist - dist);
                  }
              }
  
              // Apply arch effect to left eyebrow
              for (int i = 0; i < 4; i++) {
                  float dist = distance(uv, leftEyebrow[i]);
                  if (dist < archDist) {
                      float effect = smoothstep(archDist, 0.0, dist);
                      uv.y -= archFactor * effect * (archDist - dist);
                  }
              }
  
              // Apply arch effect to right eyebrow
              for (int i = 0; i < 4; i++) {
                  float dist = distance(uv, rightEyebrow[i]);
                  if (dist < archDist) {
                      float effect = smoothstep(archDist, 0.0, dist);
                      uv.y -= archFactor * effect * (archDist - dist);
                  }
              }
  
              // Apply pinch effect to left eyebrow
              for (int i = 0; i < 4; i++) {
                  float dist = distance(uv, leftEyebrow[i]);
                  if (dist < pinchDist) {
                      float effect = smoothstep(pinchDist, 0.0, dist);
                      uv += pinchFactor * effect * (uv - leftEyebrow[i]) * (pinchDist - dist);
                  }
              }
  
              // Apply pinch effect to right eyebrow
              for (int i = 0; i < 4; i++) {
                  float dist = distance(uv, rightEyebrow[i]);
                  if (dist < pinchDist) {
                      float effect = smoothstep(pinchDist, 0.0, dist);
                      uv += pinchFactor * effect * (uv - rightEyebrow[i]) * (pinchDist - dist);
                  }
              }
  
              // Clamp UV again after manipulation to ensure no out-of-bound UVs
              uv = clamp(uv, vec2(0.0), vec2(1.0));
  
              // Output the final texture
              gl_FragColor = texture2D(videoTexture, uv);
          }
      `,
};
