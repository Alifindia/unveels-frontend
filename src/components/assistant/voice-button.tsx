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
    if (recording) {
      setRecording(false);
      stopListening();
    } else {
      setRecording(true);
      startListening();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative grid size-28 place-items-center rounded-full [&>*]:col-start-1 [&>*]:row-start-1 ${
        recording
          ? "bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0)_0%,rgba(255,255,255,0.0175)_100%)] backdrop-blur-3xl"
          : "bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0)_0%,rgba(255,255,255,0.0175)_100%)] backdrop-blur-3xl"
      }`}
    >
      <div className="size-28 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0)_0%,rgba(255,255,255,0.0175)_100%)] backdrop-blur-3xl"></div>
      <div
        className={`size-20 rounded-full ${
          recording
            ? "bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0)_0%,rgba(255,255,255,0.1925)_100%)] backdrop-blur-md"
            : "bg-[radial-gradient(50%_50%_at_50%_50%,rgba(206,206,206,0)_0%,rgba(40,40,40,0.1925)_100%)] backdrop-blur-md"
        }`}
      ></div>
      <div
        className={`size-14 rounded-full border border-white/50 ${
          recording
            ? "bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0)_0%,rgba(255,255,255,0.1925)_100%)]"
            : "bg-[radial-gradient(50%_50%_at_50%_50%,rgba(206,206,206,0)_0%,rgba(40,40,40,0.1925)_100%)]"
        }`}
      ></div>
      <div className="relative size-9 rounded-full bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)]"></div>
      {recording ? (
        <Icons.soundwave className="relative size-9 text-white" />
      ) : (
        <Icons.microphone className="relative size-6 text-white" />
      )}
    </button>
  );
};

export default VoiceButton;
