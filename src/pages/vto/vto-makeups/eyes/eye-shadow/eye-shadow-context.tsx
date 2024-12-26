import React, { createContext, useState, useContext } from "react";

interface EyeShadowContextType {
  selectedMode: string;
  setMode: (mode: string) => void;
  modeIndex: number;
  setSelectModeIndex: (index: number) => void;
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  selectedTexture: string | null;
  setSelectedTexture: (texture: string | null) => void;
}

// Create the context
const EyeShadowContext = createContext<EyeShadowContextType | undefined>(
  undefined,
);

// Create a provider component
export function EyeShadowProvider({ children }: { children: React.ReactNode }) {
  const [selectedMode, setMode] = useState<string>("One");
  const [modeIndex, setSelectModeIndex] = useState<number>(0);
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);

  return (
    <EyeShadowContext.Provider
      value={{
        selectedMode,
        setMode,
        modeIndex,
        setSelectModeIndex,
        colorFamily,
        setColorFamily,
        selectedColors,
        setSelectedColors,
        selectedTexture,
        setSelectedTexture,
      }}
    >
      {children}
    </EyeShadowContext.Provider>
  );
}

// Custom hook to use the context
export function useEyeShadowContext() {
  const context = useContext(EyeShadowContext);
  if (context === undefined) {
    throw new Error(
      "useEyeShadowContext must be used within a EyeShadowProvider",
    );
  }
  return context;
}
