import React, { createContext, useContext, useState } from "react";

type VirtualTryOnProductContextType = {
  skus: string[];
  clearSkus: () => void;
};

type VirtualTryOnProductProviderProps = {
  children: React.ReactNode;
  initialSkus?: string[];
};

const VirtualTryOnProductContext = createContext<
  VirtualTryOnProductContextType | undefined
>(undefined);

export function VirtualTryOnProductProvider({
  children,
  initialSkus = [],
}: VirtualTryOnProductProviderProps) {
  const [skus, setSkus] = useState<string[]>(initialSkus);

  const clearSkus = () => {
    setSkus([]);
  };

  return (
    <VirtualTryOnProductContext.Provider
      value={{
        skus,

        clearSkus,
      }}
    >
      {children}
    </VirtualTryOnProductContext.Provider>
  );
}

export function useVirtualTryOnProduct() {
  const context = useContext(VirtualTryOnProductContext);
  if (!context) {
    throw new Error(
      "useVirtualTryOnProduct must be used within VirtualTryOnProductProvider",
    );
  }
  return context;
}
