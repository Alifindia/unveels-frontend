import { useState } from "react";
import { CameraProvider } from "../../context/recorder-context";
import MainContent from "./main-content";
import WelcomeScreen from "./welcome-screen";
import VocalConnectionScreen from "./vocal-connection-screen";
import TextConnectionScreen from "./text-connection-screen";
import AudioConnectionScreen from "./audio-connection-screen";

export const VirtulAssistant = () => {
  const [started, setStarted] = useState(false);
  const [screen, setScreen] = useState<"vocal" | "text" | "audio" | null>(null);
  return (
    <CameraProvider>
      <div className="h-full min-h-dvh w-full overflow-hidden bg-[linear-gradient(180deg,#47330A_0%,#0F0B02_58.39%,#000000_100%)] lg:bg-[linear-gradient(180deg,#000000_0%,#0F0B02_41.61%,#47330A_100%)]">
        {started ? (
          screen === "vocal" ? (
            <VocalConnectionScreen
              onBack={() => {
                setScreen(null);
              }}
            />
          ) : screen === "text" ? (
            <TextConnectionScreen
              onBack={() => {
                setScreen(null);
              }}
            />
          ) : screen === "audio" ? (
            <AudioConnectionScreen
              onBack={() => {
                setScreen(null);
              }}
            />
          ) : (
            <MainContent
              onBack={() => {
                setStarted(false);
              }}
              setScreen={(screen) => {
                setScreen(screen);
              }}
            />
          )
        ) : (
          <WelcomeScreen
            onStarted={() => {
              setStarted(true);
            }}
          />
        )}
      </div>
    </CameraProvider>
  );
};
