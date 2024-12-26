import { useWavesurfer } from "@wavesurfer/react";
import { PauseCircle, PlayCircle } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

const AudioWave = ({ url }: { url: string }) => {
  const containerRef = useRef(null);

  const { wavesurfer, isPlaying } = useWavesurfer({
    container: containerRef,
    height: 48,
    waveColor: "rgb(255, 255, 255)",
    progressColor: "#CA9C43",
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    cursorWidth: 0,
  });

  const onPlayPause = useCallback(() => {
    wavesurfer && wavesurfer.playPause();
  }, [wavesurfer]);

  useEffect(() => {
    if (wavesurfer && url.startsWith("blob:")) {
      fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          wavesurfer.loadBlob(blob);
        });
    } else if (wavesurfer) {
      wavesurfer.load(url);
    }
  }, [wavesurfer, url]);

  return (
    <div className="flex w-full items-center space-x-1">
      <button type="button" onClick={onPlayPause}>
        {isPlaying ? (
          <PauseCircle className="size-6" />
        ) : (
          <PlayCircle className="size-6" />
        )}
      </button>
      <div ref={containerRef} className="w-32 lg:w-96" />
    </div>
  );
};

export default AudioWave;
