import React, { createContext, useState, useContext } from "react";

interface ConcealerContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
}

// Create the context
const ConcealerContext = createContext<ConcealerContextType | undefined>(
  undefined,
);

// Create a provider component
export function ConcealerProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  return (
    <ConcealerContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
      }}
    >
      {children}
    </ConcealerContext.Provider>
  );
}

// Custom hook to use the context
export function useConcealerContext() {
  const context = useContext(ConcealerContext);
  if (context === undefined) {
    throw new Error(
      "useConcealerContext must be used within a ConcealerProvider",
    );
  }
  return context;
}
