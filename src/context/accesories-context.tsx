// MakeupContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";
import { Texture } from "three";

interface AccesoriesContextProps {
  envMapAccesories: Texture | null;
  setEnvMapAccesories: (texture: Texture | null) => void;

  showHat: boolean;
  setShowHat: (show: boolean) => void;

  showHeadband: boolean;
  setShowHeadband: (show: boolean) => void;

  showGlasess: boolean;
  setShowGlasess: (show: boolean) => void;

  showEarring: boolean;
  setShowEarring: (show: boolean) => void;

  showNecklace: boolean;
  setShowNecklace: (show: boolean) => void;

  showWatch: boolean;
  setShowWatch: (show: boolean) => void;

  showBracelet: boolean;
  setShowBracelet: (show: boolean) => void;

  showRing: boolean;
  setShowRing: (show: boolean) => void;
}

const AccesoriesContext = createContext<AccesoriesContextProps | undefined>(
  undefined,
);

interface AccesoriesProviderProps {
  children: ReactNode;
}

export const AccesoriesProvider: React.FC<AccesoriesProviderProps> = ({
  children,
}) => {
  const [envMapAccesories, setEnvMapAccesories] = useState<Texture | null>(
    null,
  );

  const [showHat, setShowHat] = useState(false);
  const [showGlasess, setShowGlasess] = useState(false);
  const [showHeadband, setShowHeadband] = useState(false);
  const [showEarring, setShowEarring] = useState(false);
  const [showNecklace, setShowNecklace] = useState(false);
  const [showWatch, setShowWatch] = useState(false);
  const [showBracelet, setShowBracelet] = useState(false);
  const [showRing, setShowRing] = useState(false);

  return (
    <AccesoriesContext.Provider
      value={{
        envMapAccesories,
        setEnvMapAccesories,

        showHat,
        setShowHat,

        showGlasess,
        setShowGlasess,

        showHeadband,
        setShowHeadband,

        showEarring,
        setShowEarring,

        showNecklace,
        setShowNecklace,

        showWatch,
        setShowWatch,

        showBracelet,
        setShowBracelet,

        showRing,
        setShowRing,
      }}
    >
      {children}
    </AccesoriesContext.Provider>
  );
};

export const useAccesories = () => {
  const context = useContext(AccesoriesContext);
  if (!context) {
    throw new Error("useAccesories must be used within a AccesoriesProvider");
  }
  return context;
};
