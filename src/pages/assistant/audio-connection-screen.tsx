import {
  BleedEffect,
  LoadingChat,
  MessageItem,
  ModelScene,
  SuggestedGifts,
  TopNavigation,
  UserInput,
} from "../../components/assistant";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactAudioPlayer from "react-audio-player";
import { useEffect, useRef, useState } from "react";
import { botPrompt } from "../../utils/prompt";
import { getCurrentTimestamp } from "../../utils/getCurrentTimeStamp";
import { ProductRequest } from "../../types/productRequest";
import { Product } from "../../api/shared";
import { fetchVirtualAssistantProduct } from "../../api/fetch-virtual-asistant-product";
import { categories } from "../../api/virtual-assistant-attributes/category";
import {
  makeSpeech,
  talkingAvatarHost,
} from "../../utils/virtualAssistantUtils";
import { BlendData } from "../../types/blendData";

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

const AudioConnectionScreen = ({ onBack }: { onBack: () => void }) => {
  const [speak, setSpeak] = useState(false);
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [msg, setMsg] = useState("");

  const [chats, setChats] = useState<Chat[]>([]);
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en-US");
  const [loading, setLoading] = useState(false);
  const audioPlayer = useRef<ReactAudioPlayer>(null);

  const [fetchProducts, setFetchProducts] = useState(false);
  const [fetchComplete, setFetchComplete] = useState(false);
  const [products, setProducts] = useState<ProductRequest[]>([]);
  const [productData, setProductData] = useState<Product[]>([]);

  const [blendshape, setBlendshape] = useState<BlendData[]>([]);

  useEffect(() => {
    const fetchAndHandleProducts = async () => {
      if (fetchProducts && products.length > 0) {
        setLoading(true);

        try {
          const fetchedProducts = await fetchVirtualAssistantProduct(
            products,
            categories,
          );
          setProductData(fetchedProducts);
          setFetchProducts(false);
        } catch (error) {
          console.error("Error fetching products:", error);
        } finally {
          setLoading(false);
          setFetchComplete(true);
        }
      }
    };

    fetchAndHandleProducts();
  }, [fetchProducts, products]);

  useEffect(() => {
    const speak = async () => {
      console.log(productData);

      if (productData.length < 1) {
        const text =
          language === "en-US"
            ? "sorry, the product is out of stock"
            : "عذرا المنتج غير متوفر";

        // Tambahkan respons ke chats
        setChats((prevChats) => [
          ...prevChats,
          {
            id: Date.now() + 1,
            text: text,
            sender: "agent",
            type: "chat",
            mode: "text-connection",
            timestamp: getCurrentTimestamp(),
          },
        ]);

        try {
          const audioSrc = await makeSpeech(
            text,
            language === "en-US" ? "en-US" : "ar-SA",
          );

          setTimeout(() => {
            setAudioSource(`${talkingAvatarHost}${audioSrc.data.filename}`);
            setBlendshape(audioSrc.data.blendData);
            setSpeak(true);
          }, 1000);
        } catch (error) {
          console.error("Error creating speech:", error);
        }
      } else {
        const text =
          language === "en-US"
            ? "Here is the product you are looking for"
            : "هذا هو المنتج الذي تبحث عنه";

        // Tambahkan respons ke chats
        setChats((prevChats) => [
          ...prevChats,
          {
            id: Date.now() + 1,
            text: text,
            sender: "agent",
            type: "chat",
            mode: "text-connection",
            timestamp: getCurrentTimestamp(),
          },
        ]);

        try {
          const audioSrc = await makeSpeech(
            text,
            language === "en-US" ? "en-US" : "ar-SA",
          );

          setTimeout(() => {
            setAudioSource(`${talkingAvatarHost}${audioSrc.data.filename}`);
            setBlendshape(audioSrc.data.blendData);
            setSpeak(true);
            setFetchComplete(false);
          }, 1000);
        } catch (error) {
          console.error("Error creating speech:", error);
        }
      }
    };

    if (fetchComplete) {
      speak();
    }
  }, [fetchComplete]);

  const getResponse = async (userMsg: string) => {
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

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro-002",
        generationConfig: { temperature: 1.3 },
        systemInstruction: botPrompt,
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const removeBackticks = responseText.replace(/```/g, "");
      const jsonLabel = removeBackticks.replace(/json/g, "");
      console.log(jsonLabel);
      const respond = JSON.parse(jsonLabel);

      if (respond.isFinished) {
        setProducts(respond.product);
        setLoading(true);
        setFetchProducts(true);
      } else {
        setChats((prevChats) => [
          ...prevChats,
          {
            id: Date.now() + 1,
            text: respond.chat,
            sender: "agent",
            type: "chat",
            mode: "text-connection",
            timestamp,
          },
        ]);
      }

      setText(respond.chat);
      setLanguage(respond.lang);
      
      if (!respond.isFinished) {
        const audioSrc = await makeSpeech(respond.chat, respond.lang);
      
        // Delay to make sure it connects
        setTimeout(() => {
          setAudioSource(`${talkingAvatarHost}${audioSrc.data.filename}`);
          setBlendshape(audioSrc.data.blendData);
          setSpeak(true);
        }, 1000);
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSendMessage = (message: string, audioURL: string | null = null) => {
    const timestamp = getCurrentTimestamp();

    console.log(message === "" ? true : false);

    if (audioURL) {
      setChats((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: message,
          sender: "user",
          mode: "text-connection",
          type: "audio",
          timestamp,
          audioURL: audioURL,
        },
      ]);
    } else {
      setChats((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: message,
          type: "chat",
          sender: "user",
          mode: "text-connection",
          timestamp,
          audioURL: null,
        },
      ]);
    }

    getResponse(message);
  };

  function playerEnded() {
    setAudioSource(null);
    setSpeak(false);
    setPlaying(false);
  }

  function playerReady() {
    audioPlayer.current?.audioEl.current?.play();
    setPlaying(true);
    const timestamp = getCurrentTimestamp();
  }

  useEffect(() => {
    const chatBox = document.querySelector(".chat-box");
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
    console.log(chats);
  }, [chats]);

  return (
    <div className="relative mx-auto flex h-full min-h-dvh w-full flex-col bg-[linear-gradient(180deg,#000000_0%,#0F0B02_41.61%,#47330A_100%)]">
      <div className="pointer-events-none absolute inset-0 flex justify-center overflow-hidden">
        <ModelScene speak={speak} playing={playing} blendshape={blendshape} />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-1/2 flex-col bg-gradient-to-b from-[#1B1404] to-[#2C1F06]">
        <div className="chat-box flex-1 space-y-4 overflow-y-auto p-4 text-xl text-white">
          {chats.map((chat) => (
            <MessageItem key={chat.id} message={chat} />
          ))}
          {loading && <LoadingChat showAvatar={false} />}
        </div>
        {productData.length > 0 && <SuggestedGifts product={productData} />}
        <div className="relative overflow-hidden rounded-t-3xl bg-black/25 shadow-[inset_0px_1px_0px_0px_#FFFFFF40] backdrop-blur-3xl">
          <div className="pointer-events-none absolute inset-x-0 -top-[116px] flex justify-center">
            <BleedEffect className="h-48" />
          </div>
          <div className="mx-auto flex w-full max-w-xl items-center space-x-2.5 rounded-full px-4 py-5 lg:space-x-20">
            <UserInput
              msg={msg}
              setMsg={setMsg}
              onSendMessage={onSendMessage}
            />
          </div>
        </div>
      </div>
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

      <TopNavigation onBack={onBack} />
    </div>
  );
};

export default AudioConnectionScreen;
