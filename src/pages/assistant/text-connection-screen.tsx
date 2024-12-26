import {
  BleedEffect,
  LoadingChat,
  MessageItem,
  SuggestedGifts,
  TopNavigation,
  UserInput,
} from "../../components/assistant";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useEffect, useState } from "react";
import { botPrompt } from "../../utils/prompt";
import { categories } from "../../api/virtual-assistant-attributes/category";
import { ProductRequest } from "../../types/productRequest";
import { fetchVirtualAssistantProduct } from "../../api/fetch-virtual-asistant-product";
import { Product } from "../../api/shared";
import { getCurrentTimestamp } from "../../utils/getCurrentTimeStamp";
import { mediaUrl } from "../../utils/apiUtils";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_BARD_API_KEY);

type Chat =
  | {
      id: number;
      text: string;
      sender: string;
      type?: "chat" | "audio" | "product";
      mode: "voice-connection" | "text-connection" | "audio-connection";
      timestamp: string;
      audioURL?: string | null;
    }
  | {
      id: number;
      type: "chat" | "audio" | "product";
      sender: string;
      audioURL?: string | null;
      text?: undefined;
      timestamp: string;
    }
  | {
      id: number;
      type: "chat" | "audio" | "product";
      sender: string;
      name: string;
      price: string;
      originalPrice: string;
      image: string;
      brand: string;
      text?: undefined;
      timestamp: string;
    };

const TextConnectionScreen = ({ onBack }: { onBack: () => void }) => {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: 1,
      text: "Hello! I am Sarah. How can I assist you today?",
      sender: "agent",
      type: "chat",
      mode: "text-connection",
      timestamp: getCurrentTimestamp(),
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [fetchProducts, setFetchProducts] = useState(false);
  const [products, setProducts] = useState<ProductRequest[]>([]);
  const [productData, setProductData] = useState<Product[]>([]);

  useEffect(() => {
    if (fetchProducts && products.length > 0) {
      setLoading(true);
      fetchVirtualAssistantProduct(products, categories)
        .then((fetchedProducts) => {
          setProductData(fetchedProducts);
          setFetchProducts(false);

          fetchedProducts.forEach((item) => {
            const imageUrl =
              mediaUrl(item.media_gallery_entries[0]?.file) ??
              "https://picsum.photos/id/237/200/300";
            setChats((prevChats) => [
              ...prevChats,
              {
                id: item.id,
                type: "product",
                sender: "agent",
                name: item.name,
                price: item.price,
                originalPrice: item.price,
                image: imageUrl,
                brand: "Tom Ford",
                timestamp: getCurrentTimestamp(),
              },
            ]);
          });
        })
        .finally(() => setLoading(false));
    }
  }, [fetchProducts, products]); // Hapus chats dari sini!

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

    console.log(prompt);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro-002",
        generationConfig: { temperature: 1.3 },
        systemInstruction: botPrompt,
      });
      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
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
          mode: "text-connection",
          timestamp,
        },
      ]);

      if (respond.isFinished) {
        setProducts(respond.product);
        setLoading(true);
        setFetchProducts(true);
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSendMessage = (message: string, audioURL: string | null = null) => {
    const timestamp = getCurrentTimestamp();

    if (audioURL) {
      setChats((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: message != "" ? message : "",
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

    console.log(chats);

    getResponse(message);
  };

  return (
    <div className="relative mx-auto flex h-dvh w-full flex-col bg-[linear-gradient(180deg,#000000_0%,#0F0B02_41.61%,#47330A_100%)]">
      <main className="flex-1 space-y-4 overflow-y-auto p-4 pt-20">
        {chats.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        {loading && <LoadingChat />}
      </main>
      <footer className="relative overflow-hidden rounded-t-3xl bg-black/25 shadow-[inset_0px_1px_0px_0px_#FFFFFF40] backdrop-blur-3xl">
        <div className="pointer-events-none absolute inset-x-0 -top-[116px] flex justify-center">
          <BleedEffect className="h-48" />
        </div>
        <div className="mx-auto flex w-full max-w-xl items-center space-x-2.5 rounded-full px-4 py-5 lg:space-x-20">
          <UserInput msg={msg} setMsg={setMsg} onSendMessage={onSendMessage} />
        </div>
      </footer>

      <TopNavigation onBack={onBack} />
    </div>
  );
};

export default TextConnectionScreen;
