import clsx from "clsx";
import AudioWave from "./audio-wave";

type Message =
  | {
      id: number;
      text: string;
      sender: string;
      type?: "chat" | "audio";
      mode: "voice-connection" | "text-connection" | "audio-connection";
      timestamp: string;
      audioURL?: string | null;
    }
  | {
      id: number;
      type: "audio";
      sender: string;
      audioURL?: string | null;
      text?: undefined;
      timestamp: string;
    }
  | {
      id: number;
      type: "product";
      sender: string;
      name: string;
      price: string;
      originalPrice: string;
      image: string;
      brand: string;
      text?: undefined;
      timestamp: string;
    };

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.sender === "user";
  const isAudioConnection =
    "mode" in message && message.mode === "audio-connection";
  const isTextConnection =
    "mode" in message && message.mode === "text-connection";

  // Hide agent's message bubble only during audio-connection
  if (message.sender === "agent" && isAudioConnection) {
    return null;
  }

  return (
    <div
      className={clsx("mb-4 flex w-full", {
        "justify-end": isUser, // Align user's messages to the right
        "justify-start": !isUser, // Align agent's messages to the left
      })}
    >
      <div className="flex max-w-[75%] items-end space-x-2">
        {/* Avatar for agent messages on the left */}
        {!isUser && (
          <img
            alt="Agent"
            className="size-[38.5px] rounded-full sm:size-[55px]"
            src={"media/unveels/avatar-images/sarah-avatar.png"}
          />
        )}

        {/* Message bubble */}
        <div
          className={clsx(
            "relative w-full rounded-3xl p-3 text-white",
            isUser
              ? "rounded-br-none bg-[linear-gradient(90deg,rgba(202,156,67,0.2)_0%,rgba(145,110,43,0.2)_27.4%,rgba(106,79,27,0.2)_59.4%,rgba(71,50,9,0.2)_100%)]"
              : "rounded-bl-none bg-[linear-gradient(90deg,rgba(202,156,67,0.5)_0%,rgba(145,110,43,0.5)_27.4%,rgba(106,79,27,0.5)_59.4%,rgba(71,50,9,0.5)_100%)]",
            message.type === "audio" ? "px-4 py-2" : "p-3",
          )}
        >
          {message.type === "audio" && message.audioURL ? (
            <AudioWave url={message.audioURL} />
          ) : message.type === "product" ? (
            <div className="flex w-full flex-col rounded-lg">
              <img
                alt={message.name}
                className="aspect-square w-full rounded-md object-cover"
                src={message.image}
              />
              <div className="line-clamp-2 py-2 text-left text-[0.625rem] font-semibold text-white">
                {message.name}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[0.5rem] text-white/60">{message.brand}</p>
                <div className="flex flex-wrap items-center justify-end gap-x-1">
                  <span className="text-[0.625rem] font-bold text-white">
                    {message.price}
                  </span>
                  <span className="text-[0.5rem] text-white/50 line-through">
                    {message.originalPrice}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="lg w-full text-[9.8px] sm:text-sm">{message.text}</p>
          )}
        </div>

        {/* Placeholder for user avatar on the right */}
        {isUser && (
          <div className="h-12 w-12 flex-shrink-0 rounded-full bg-white/20" />
        )}
      </div>
    </div>
  );
};

export default MessageItem;
