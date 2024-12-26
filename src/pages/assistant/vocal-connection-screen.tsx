import { useEffect, useRef, useState } from "react";
import { Icons } from "../../components/icons";
import {
  BleedEffect,
  LoadingChat,
  MessageItem,
  ModelScene,
  SuggestedGifts,
  TopNavigation,
  UserInput,
  // UserInput,
} from "../../components/assistant";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactAudioPlayer from "react-audio-player";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import VoiceButton from "../../components/assistant/voice-button";
import { X } from "lucide-react";
import { botPrompt } from "../../utils/prompt";
import { ProductRequest } from "../../types/productRequest";
import { Product } from "../../api/shared";
import { fetchVirtualAssistantProduct } from "../../api/fetch-virtual-asistant-product";
import { categories } from "../../api/virtual-assistant-attributes/category";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_BARD_API_KEY);

interface Chat {
  id: number;
  text: string;
  sender: "user" | "agent";
  mode: "voice-connection" | "text-connection" | "audio-connection";
  type: "audio" | "chat";
  timestamp: string;
  audioURL?: string | null;
}

const VocalConnectionScreen = ({ onBack }: { onBack: () => void }) => {
  const [recording, setRecording] = useState(false);
  const [showUserInput, setShowUserInput] = useState(false);

  const [speak, setSpeak] = useState(false);
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [msg, setMsg] = useState("Hi I'm Sarah");

  const [chats, setChats] = useState<Chat[]>([]);

  const [text, setText] = useState("");
  const [languange, setLanguage] = useState("");

  const [loading, setLoading] = useState(false);
  const audioPlayer = useRef<ReactAudioPlayer>(null);
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const [fetchProducts, setFetchProducts] = useState(false);
  const [products, setProducts] = useState<ProductRequest[]>([]);
  const [productData, setProductData] = useState<Product[]>([]);

  const getCurrentTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    setMsg(transcript);
  }, [transcript]);

  useEffect(() => {
    if (fetchProducts && products.length > 0) {
      setLoading(true);
      fetchVirtualAssistantProduct(products, categories)
        .then((fetchedProducts) => {
          setProductData(fetchedProducts);
          setFetchProducts(false);
          setLoading(false);
        })
        .finally(() => setLoading(false));
    }
  }, [fetchProducts, products]);

  const getResponse = async (userMsg: string) => {
    if (!userMsg.trim()) {
      console.error("Prompt can't be empty.");
      return;
    }

    const timestamp = getCurrentTimestamp();
    setLoading(true);

    const conversationHistory = [
      ...chats.map((message) =>
        message.sender === "user"
          ? `User: ${message.text}`
          : `Agent: ${message.text}`,
      ),
    ].join("\n");

    const prompt = `${conversationHistory}\nUser: ${userMsg}\nAgent:`;

    console.log(prompt);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro-002",
      generationConfig: { temperature: 1.3 },
      systemInstruction: botPrompt,
    });
    const result = await model.generateContent(prompt);

    try {
      const responseText = await result.response.text(); // Pastikan await di sini jika perlu
      const removeBackticks = responseText.replace(/```/g, "");
      const jsonLabel = removeBackticks.replace(/json/g, "");
      console.log(jsonLabel);
      const respond = JSON.parse(jsonLabel);

      // Tambahkan respons ke chats
      setChats((prevChats) => [
        ...prevChats,
        {
          id: Date.now() + 1,
          text: respond.chat,
          sender: "agent",
          type: "chat",
          mode: "voice-connection",
          timestamp,
        },
      ]);

      if (respond.isFinished) {
        setProducts(respond.product);
        setLoading(true);
        setFetchProducts(true);
      }

      setText(respond.chat);
      setLanguage(respond.lang);
      setSpeak(true);
    } catch (error) {
      setText(await result.response.text());
      setSpeak(true);
      console.error("Error fetching AI response:", error);
    } finally {
      setLoading(false);
    }
  };

  function playerEnded() {
    setAudioSource(null);
    setSpeak(false);
    setPlaying(false);
    setLoading(false);
    setMsg("");
  }

  function playerReady() {
    audioPlayer.current?.audioEl.current?.play();
    setPlaying(true);
  }

  const startListening = () => {
    if (loading) {
      console.log("Currently loading; cannot start listening.");
      return;
    }
    if (browserSupportsSpeechRecognition) {
      resetTranscript(); // Clear previous transcript
      SpeechRecognition.startListening({ continuous: true, language: "id-ID" });
    } else {
      console.error("Voice recognition not supported in this browser.");
    }
  };

  const stopListening = () => {
    if (loading) {
      console.log("Currently loading; cannot start listening.");
      return;
    }
    SpeechRecognition.stopListening();
    if (msg.trim()) {
      addChatMessage(msg); // Add the transcript to chats when recording stops
    } else {
      console.error("Message cannot be empty.");
    }
  };

  const addChatMessage = (message: string) => {
    const timestamp = getCurrentTimestamp();
    setChats((prevChats) => [
      ...prevChats,
      {
        id: Date.now(),
        text: message,
        sender: "user",
        mode: "voice-connection",
        type: "chat",
        timestamp,
      },
    ]);
    getResponse(message);
    setMsg("");
  };

  const onSendMessage = (message: string) => {
    getResponse(message);
    setMsg("");
  };

  return (
    <div className="relative mx-auto flex h-full min-h-dvh w-full flex-col bg-[linear-gradient(180deg,#000000_0%,#0F0B02_41.61%,#47330A_100%)]">
      <div className="pointer-events-none absolute inset-0 flex justify-center overflow-hidden">
        <ModelScene
          speak={speak}
          text={text}
          playing={playing}
          setAudioSource={setAudioSource}
          setSpeak={setSpeak}
          language={languange}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-1/3 flex-col bg-gradient-to-b from-[#1B1404] to-[#2C1F06]">
        <div className="flex-1 p-4 text-xl text-white">
          {productData.length > 0 && <SuggestedGifts product={productData} />}
          {loading ? <LoadingChat showAvatar={false} /> : msg}
        </div>
        <div className="relative overflow-hidden rounded-t-3xl bg-black/25 shadow-[inset_0px_1px_0px_0px_#FFFFFF40] backdrop-blur-3xl">
          <div className="pointer-events-none absolute inset-x-0 -top-[116px] flex justify-center">
            <BleedEffect className="h-48" />
          </div>
          <div className="mx-auto flex w-full max-w-lg items-center justify-around py-2">
            <button
              type="button"
              className={`mr-2 rounded-full p-3 ${
                showUserInput
                  ? "bg-[#CA9C43]"
                  : "border border-white/10 bg-[#171717]"
              }`}
              onClick={() => setShowUserInput(!showUserInput)}
            >
              <Icons.keyboard className="size-6 text-white" />
            </button>

            {showUserInput ? (
              <div className="flex h-28 w-full items-center justify-center">
                <UserInput
                  msg={msg}
                  setMsg={setMsg}
                  onSendMessage={onSendMessage}
                  showVoice={false}
                />
              </div>
            ) : (
              <>
                <VoiceButton
                  recording={recording}
                  setRecording={setRecording}
                  startListening={startListening}
                  stopListening={stopListening}
                />

                <button
                  type="button"
                  className="rounded-full border border-white/10 bg-[#171717] p-3"
                >
                  <X className="size-6 text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <ReactAudioPlayer
        src={audioSource ?? undefined}
        ref={audioPlayer}
        onEnded={playerEnded}
        onCanPlayThrough={playerReady}
      />

      <TopNavigation onBack={onBack} />
    </div>
  );
};

export default VocalConnectionScreen;
