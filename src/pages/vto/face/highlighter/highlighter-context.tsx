import React, { createContext, useState, useContext } from "react";

interface HighlighterContextType {
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedShape: string | null;
  setSelectedShape: (shape: string) => void;
  selectedTexture: string | null;
  setSelectedTexture: (mode: string | null) => void;
}

// Create the context
const HighlighterContext = createContext<HighlighterContextType | undefined>(
  undefined,
);

// Create a provider component
export function HighlighterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedShape, setSelectedShape] = useState<string>("0");
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);

  return (
    <HighlighterContext.Provider
      value={{
        selectedColor,
        setSelectedColor,
        selectedShape,
        setSelectedShape,
        selectedTexture,
        setSelectedTexture,
      }}
    >
      {children}
    </HighlighterContext.Provider>
  );
}

// Custom hook to use the context
export function useHighlighterContext() {
  const context = useContext(HighlighterContext);
  if (context === undefined) {
    throw new Error(
      "useHighlighterContext must be used within a HighlighterProvider",
    );
  }
  return context;
}
