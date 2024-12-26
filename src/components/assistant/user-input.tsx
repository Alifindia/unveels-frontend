import { useWavesurfer } from "@wavesurfer/react";
import clsx from "clsx";
import { CirclePlay, Mic, PauseCircle, Send, Trash } from "lucide-react";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.js";
import { updateProgress } from "../../utils/updateProgress";

interface UserInputProps {
  msg: string;
  setMsg: (value: string) => void;
  onSendMessage: (message: string, audioURL?: string | null) => void;
  showVoice?: boolean;
}

const UserInput = ({
  msg,
  setMsg,
  onSendMessage,
  showVoice = true,
}: UserInputProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [recordingState, setRecordingState] = useState<
    "idle" | "recording" | "paused"
  >("idle");
  const [progressMs, setProgressMs] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isSendDisabled, setIsSendDisabled] = useState(false); // New state for disabling send button
  const transcriptRef = useRef<string>("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [audioURL, setAudioURL] = useState<string | null>(null);

  const plugins = useMemo(
    () => [
      RecordPlugin.create({
        scrollingWaveform: true,
        renderRecordedAudio: false,
      }),
    ],
    [],
  );

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    height: 48,
    waveColor: "rgb(255, 255, 255)",
    progressColor: "#CA9C43",
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    cursorWidth: 0,
    plugins,
  });

  const record = plugins[0];

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "id-ID";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            transcriptRef.current += result[0].transcript + " ";
          }
        }
      };

      recognition.onend = () => {
        setVoiceTranscript(transcriptRef.current.trim());
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("SpeechRecognition tidak didukung di browser ini.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (recordingState === "recording" && recognitionRef.current) {
      recognitionRef.current.start();
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [recordingState]);

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (wavesurfer) {
      wavesurfer.registerPlugin(record);

      record.on("record-start", () => {
        console.log("Recording started");
        setRecordingState("recording");
        setProgressMs(0); // Reset progress
        transcriptRef.current = "";
        setAudioURL(null);

        // Start a custom timer to simulate progress updates
        recordingIntervalRef.current = setInterval(() => {
          setProgressMs((prev) => prev + 1000); // Increase by 1000 ms (1 second)
        }, 1000);
      });

      record.on("record-end", (blob) => {
        console.log("Recording ended");
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        const generatedAudioURL = URL.createObjectURL(blob);
        setAudioURL(generatedAudioURL);
        setRecordingState("idle");
        setVoiceTranscript(transcriptRef.current.trim());

        if (isSending) {
          onSendMessage(transcriptRef.current.trim(), generatedAudioURL);
          transcriptRef.current = "";
          setIsSending(false);
        }

        setIsSendDisabled(false);
      });

      record.on("record-pause", () => {
        console.log("Recording paused");
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        setVoiceTranscript(transcriptRef.current.trim());
        setRecordingState("paused");
      });

      record.on("record-resume", () => {
        console.log("Recording resumed");
        setRecordingState("recording");

        // Restart the interval for progress updates
        recordingIntervalRef.current = setInterval(() => {
          setProgressMs((prev) => prev + 1000); // Increase by 1000 ms (1 second)
        }, 1000);
      });

      return () => {
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current); // Clear interval on component unmount
        }
        record.destroy();
        record.unAll();
      };
    }
  }, [wavesurfer, record, isSending, onSendMessage]);

  const handleTrashClick = () => {
    setAudioURL(null);
    setVoiceTranscript("");
    transcriptRef.current = "";
    setRecordingState("idle");
    setIsSendDisabled(false);
    if (wavesurfer && record) {
      record.destroy();
      const newRecord = RecordPlugin.create({
        scrollingWaveform: true,
        renderRecordedAudio: false,
      });
      wavesurfer.registerPlugin(newRecord);
    }
  };

  const handleSendMessage = () => {
    if (recordingState === "recording" || recordingState === "paused") {
      setIsSending(true);
      setIsSendDisabled(true);
      record.stopRecording();
    } else {
      onSendMessage(msg, null);
      setMsg("");
    }
    setRecordingState("idle");
  };

  const handleMicrophoneClick = () => {
    if (recordingState === "idle") {
      record.startRecording();
      setIsSendDisabled(true);
    } else if (recordingState === "recording") {
      record.pauseRecording();
      setIsSendDisabled(false);
    } else {
      record.resumeRecording();
      setIsSendDisabled(true);
    }
  };

  return (
    <>
      <div className="relative mr-3 flex w-full justify-between p-px">
        <div
          className="pointer-events-none absolute inset-0 rounded-full border border-transparent"
          style={
            {
              background: `linear-gradient(90deg, #CA9C43 0%, #916E2B 27.4%, #6A4F1B 59.4%, #473209 100%)`,
              "-webkit-mask": `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
              mask: `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
              "-webkit-mask-composite": "destination-out",
              "mask-composite": "exclude",
            } as CSSProperties
          }
        />
        {recordingState !== "idle" ? (
          <div className="mx-2 flex items-center space-x-2">
            <button type="button" onClick={handleTrashClick}>
              <Trash className="size-6 text-white" />
            </button>

            <span className="text-white">{updateProgress(progressMs)}</span>
          </div>
        ) : null}
        <input
          className={clsx(
            "w-full rounded-full bg-black px-3 py-4 text-white placeholder-gray-400",
            { invisible: recordingState !== "idle" },
          )}
          placeholder="Ask me anything..."
          type="text"
          value={recordingState === "idle" ? msg : voiceTranscript}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isSendDisabled) {
              handleSendMessage();
            }
          }}
        />

        <div
          className={clsx(
            "pointer-events-none absolute inset-0 flex items-center justify-center rounded-full pl-20 pr-14",
            {
              invisible: recordingState === "idle",
            },
          )}
        >
          <div ref={containerRef} className="w-48 px-4 lg:w-64" />
        </div>

        <div className="absolute inset-y-0 right-0 flex h-full w-12 items-center justify-center">
          {showVoice ? (
            <>
              {" "}
              <button type="button" onClick={handleMicrophoneClick}>
                {recordingState === "idle" ? (
                  <Mic className="size-6 text-gray-400" />
                ) : recordingState === "recording" ? (
                  <PauseCircle className="size-6 text-red-600" />
                ) : (
                  <CirclePlay className="size-6 text-white" />
                )}
              </button>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={handleSendMessage}
        disabled={isSendDisabled} // Disable button based on state
        className={clsx(
          "flex size-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)]",
          { "cursor-not-allowed opacity-50": isSendDisabled },
        )}
      >
        <Send className="h-6 w-6 text-white" />
      </button>
    </>
  );
};

export default UserInput;
