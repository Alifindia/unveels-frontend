import { useEffect, useRef, useState } from "react";
import ReactAudioPlayer from "react-audio-player";
import ModelSceneWeb from "../components/assistant/web/model-scene-web";

export function VirtualAvatar() {
  const [speak, setSpeak] = useState(false);
  const [text, setText] = useState("");
  const [playing, setPlaying] = useState(false);
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const [language, setLanguage] = useState("en-US");

  const audioPlayer = useRef<ReactAudioPlayer>(null);

  // Fungsi untuk menerima data dari Flutter
  const receiveTextAndLanguage = (
    incomingText: string,
    incomingLanguage: string,
  ) => {
    console.log("Data received from Flutter:", incomingText, incomingLanguage);
    setText(incomingText);
    setLanguage(incomingLanguage);
    setSpeak(true);
  };

  // Menambahkan fungsi ke window setelah komponen dimuat
  useEffect(() => {
    console.log("VirtualAvatar component is mounted");

    // Menambahkan receiveTextAndLanguage ke window setelah komponen dimuat
    (window as any).receiveTextAndLanguage = receiveTextAndLanguage;

    // Pembersihan komponen: menghapus fungsi dari window saat komponen di-unmount
    return () => {
      console.log("Cleanup: removing receiveTextAndLanguage from window");
      (window as any).receiveTextAndLanguage = undefined;
    };
  }, []); // Efek ini hanya berjalan sekali, setelah komponen dimuat

  function playerEnded() {
    setAudioSource(null);
    setSpeak(false);
    setPlaying(false);
  }

  function playerReady() {
    audioPlayer.current?.audioEl.current?.play();
    setPlaying(true);
  }

  return (
    <div className="relative mx-auto flex h-full min-h-dvh w-full flex-col bg-[linear-gradient(180deg,#000000_0%,#0F0B02_41.61%,#47330A_100%)]">
      <div className="pointer-events-none absolute inset-0 flex justify-center overflow-hidden">
        <ModelSceneWeb
          speak={speak}
          text={text}
          playing={playing}
          setAudioSource={setAudioSource}
          setSpeak={setSpeak}
          language={language}
        />
        <ReactAudioPlayer
          src={audioSource ?? undefined}
          ref={audioPlayer}
          onEnded={playerEnded}
          onCanPlayThrough={playerReady}
          onError={(e) => {
            console.error("Audio Playback Error:", e);
            console.log(
              "Audio Source:",
              audioSource || "No audio source provided",
            );
          }}
        />
      </div>
    </div>
  );
}
