/**
 * Maps the bounding box from the original video dimensions to the rendered video dimensions.
 */
export const mapBoxToRenderedVideo = (
  box: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  },
  video: HTMLVideoElement | HTMLImageElement,
  videoRect: DOMRect,
  flipped: boolean,
) => {
  let { originX, originY, width, height } = box;

  const videoWidth =
    "videoWidth" in video ? video.videoWidth : video.naturalWidth;
  const videoHeight =
    "videoHeight" in video ? video.videoHeight : video.naturalHeight;

  const renderedWidth = videoRect.width;
  const renderedHeight = videoRect.height;

  const scale = Math.max(
    renderedWidth / videoWidth,
    renderedHeight / videoHeight,
  );
  const scaledWidth = videoWidth * scale;
  const scaledHeight = videoHeight * scale;

  const cropX = (scaledWidth - renderedWidth) / 2;
  const cropY = (scaledHeight - renderedHeight) / 2;

  let x = originX * scale - cropX - 80;
  let y = originY * scale - cropY - 100;
  let boxWidth = width * scale * 1.25;
  let boxHeight = height * scale * 1.25;

  if (flipped) {
    x = renderedWidth - (x + boxWidth);
  }

  return { x, y, width: boxWidth, height: boxHeight };
};

/**
 * Maps a single keypoint from the original video dimensions to the rendered video dimensions.
 */
export const mapPointToRenderedVideo = (
  keypoint: { x: number; y: number },
  video: HTMLVideoElement | HTMLImageElement,
  videoRect: DOMRect,
  flipped: boolean,
) => {
  let { x, y } = keypoint;

  x *= "videoWidth" in video ? video.videoWidth : video.naturalWidth;
  y *= "videoHeight" in video ? video.videoHeight : video.naturalHeight;

  const videoWidth =
    "videoWidth" in video ? video.videoWidth : video.naturalWidth;
  const videoHeight =
    "videoHeight" in video ? video.videoHeight : video.naturalHeight;

  const renderedWidth = videoRect.width;
  const renderedHeight = videoRect.height;

  const scale = Math.max(
    renderedWidth / videoWidth,
    renderedHeight / videoHeight,
  );
  const scaledWidth = videoWidth * scale;
  const scaledHeight = videoHeight * scale;

  const cropX = (scaledWidth - renderedWidth) / 2;
  const cropY = (scaledHeight - renderedHeight) / 2;

  let mappedX = x * scale - cropX;
  let mappedY = y * scale - cropY;

  if (flipped) {
    mappedX = renderedWidth - mappedX;
  }

  return { x: mappedX, y: mappedY };
};
