import React, { createContext, useContext, useState } from "react";

type VirtualTryOnMakeupsVoiceContextType = {
  selectedMakeup: string | null;
  setSelectedMakeup: (string: string | null) => void;
};

type VirtualTryOnMakeupsVoiceProviderProps = {
  children: React.ReactNode;
};

const VirtualTryOnMakeupsVoiceContext = createContext<
  VirtualTryOnMakeupsVoiceContextType | undefined
>(undefined);

export function VirtualTryOnMakeupsVoiceProvider({
  children,
}: VirtualTryOnMakeupsVoiceProviderProps) {
  const [selectedMakeup, setSelectedMakeup] = useState<string | null>(null);

  return (
    <VirtualTryOnMakeupsVoiceContext.Provider
      value={{
        selectedMakeup,
        setSelectedMakeup,
      }}
    >
      {children}
    </VirtualTryOnMakeupsVoiceContext.Provider>
  );
}

export function useVirtualTryOnMakeupsVoice() {
  const context = useContext(VirtualTryOnMakeupsVoiceContext);
  if (!context) {
    throw new Error(
      "useVirtualTryOnMakeupsVoice must be used within VirtualTryOnMakeupsVoiceProvider",
    );
  }
  return context;
}
