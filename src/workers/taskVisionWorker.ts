self.onmessage = (e) => {
  const { imageData, maskData, legendColors } = e.data;
  for (let i = 0; i < maskData.length; ++i) {
    const maskVal = Math.round(maskData[i] * 255.0);
    if (maskVal === 1) {
      const legendColor = legendColors[maskVal % legendColors.length];
      const j = i * 4;
      imageData[j] = (legendColor[0] + imageData[j]) / 255;
      imageData[j + 1] = (legendColor[1] + imageData[j + 1]) / 255;
      imageData[j + 2] = (legendColor[2] + imageData[j + 2]) / 255;
      imageData[j + 3] = (legendColor[3] + imageData[j + 3]) / 255;
    }
  }

  self.postMessage(imageData);
};
