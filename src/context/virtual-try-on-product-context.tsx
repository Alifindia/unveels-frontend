import React, { createContext, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

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
  const [searchParams] = useSearchParams();
  const [skus, setSkus] = useState<string[]>(() => {
    const sku = searchParams.get("sku");
    if (sku) {
      return sku.split(",");
    }
    return initialSkus;
  });

  const clearSkus = () => {
    setSkus([]);
  };

  useEffect(() => {
    const skus = searchParams.get("sku");
    if (skus) {
      setSkus(skus.split(","));
    }
  }, [searchParams]);

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
