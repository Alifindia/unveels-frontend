import { useEffect, useRef, useState } from "react";
import ReactAudioPlayer from "react-audio-player";
import ModelSceneWeb from "../components/assistant/web/model-scene-web";
import { makeSpeech, talkingAvatarHost } from "../utils/virtualAssistantUtils";
import { BlendData } from "../types/blendData";

export function VirtualAvatar() {
  const [speak, setSpeak] = useState(false);
  const [text, setText] = useState("");
  const [playing, setPlaying] = useState(false);
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const [language, setLanguage] = useState("en-US");

  const [blendshape, setBlendshape] = useState<BlendData[]>([]);

  const [finishTalking, setFinishTalking] = useState<boolean>(false);

  const [firstTime, setFirstTime] = useState<number>(0);

  const audioPlayer = useRef<ReactAudioPlayer>(null);

  // Fungsi untuk menerima data dari Flutter
  const receiveTextAndLanguage = async (
    incomingText: string,
    incomingLanguage: string,
  ) => {
    console.log("Data received from Flutter:", incomingText, incomingLanguage);

    const audioSrc = await makeSpeech(incomingText, incomingLanguage);
    setTimeout(() => {
      setBlendshape(audioSrc.data.blendData);
      setAudioSource(`${talkingAvatarHost}${audioSrc.data.filename}`);
    }, 1000);
  };

  useEffect(() => {
    console.log("VirtualAvatar component is mounted");

    (window as any).receiveTextAndLanguage = receiveTextAndLanguage;

    return () => {
      console.log("Cleanup: removing receiveTextAndLanguage from window");
      (window as any).receiveTextAndLanguage = undefined;
    };
  }, []);

  const onFinishTalking = (condition: boolean) => {
    setTimeout(() => {
      setSpeak(false);
      setPlaying(false);
    }, 1500);
    console.log("FINISH TALKING", condition);
  };

  return (
    <div className="relative mx-auto flex h-full min-h-dvh w-full flex-col bg-[linear-gradient(180deg,#000000_0%,#0F0B02_41.61%,#47330A_100%)]">
      <div className="pointer-events-none absolute inset-0 flex justify-center overflow-hidden">
        <ModelSceneWeb
          blendshape={blendshape}
          speak={speak}
          playing={playing}
          setFinishTalking={(condition) => onFinishTalking(condition)}
        />
      </div>
      <ReactAudioPlayer
        src={audioSource ?? undefined}
        ref={audioPlayer}
        onEnded={() => onFinishTalking(false)}
        onCanPlayThrough={() => console.log("READY")}
        onCanPlay={() => {
          setFinishTalking(false);
          setSpeak(true);
          setPlaying(true);
        }}
        autoPlay
      />
    </div>
  );
}
