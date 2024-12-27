import VoiceButton from "../assistant/voice-button";
import { useFunctionCommand } from "./useFunctionCommand";

const VoiceCommand = () => {
 const {recording,setRecording,startListening,stopListening} = useFunctionCommand();
  return (
    <div>
      <VoiceButton
        recording={recording}
        setRecording={setRecording}
        startListening={startListening}
        stopListening={stopListening}
      />
    </div>
  );
};

export default VoiceCommand;
