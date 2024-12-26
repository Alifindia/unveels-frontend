/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Icons } from "../icons";

interface RecordButtonProps {
  recording: boolean;
  setRecording: (value: boolean) => void;
  startListening: () => void;
  stopListening: () => void;
}
const VoiceButton = ({
  recording,
  setRecording,
  startListening,
  stopListening,
}: RecordButtonProps) => {

  const handleClick = () => {
    setRecording(!recording);
    recording ? stopListening() : startListening();
  };

  console.log(recording, "recording");
  
  return (
    <button type="button" onClick={handleClick}>
      {recording ? (
        <Icons.speech
          className={`size-4 sm:size-6`}
          color="#C79A42"
        />
      ) : (
        <Icons.speech className={`size-4 sm:size-6`} color="white" />
      )}
    </button>
  );
};

export default VoiceButton;
